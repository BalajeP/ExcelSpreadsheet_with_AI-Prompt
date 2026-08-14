import type { SheetData, DashboardWidget, AiActionResponse, ChartType } from '../types';

export class AiEngine {
  /**
   * Processes a user prompt against the current sheet metadata and data rows
   */
  static async processPrompt(
    prompt: string,
    sheetData: SheetData,
    apiKey?: string
  ): Promise<AiActionResponse> {
    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // 1. If Gemini API key is provided, attempt online call first
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const result = await this.callGeminiApi(cleanPrompt, sheetData, apiKey);
        if (result) return result;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in NLP parser', err);
      }
    }

    // 2. Intelligent Offline Fallback Parser
    return this.processOfflinePrompt(cleanPrompt, lower, sheetData);
  }

  /**
   * Offline natural language intent parser
   */
  private static processOfflinePrompt(
    prompt: string,
    lower: string,
    sheetData: SheetData
  ): AiActionResponse {
    // --- INTENT A: CHART CREATION (e.g., "create a circular pie chart for data1 and count") ---
    if (
      lower.includes('chart') ||
      lower.includes('pie') ||
      lower.includes('graph') ||
      lower.includes('donut') ||
      lower.includes('bar') ||
      lower.includes('plot') ||
      lower.includes('dashboard')
    ) {
      let chartType: ChartType = 'bar';
      if (lower.includes('pie') || lower.includes('circular')) chartType = 'pie';
      else if (lower.includes('donut') || lower.includes('doughnut')) chartType = 'doughnut';
      else if (lower.includes('line') || lower.includes('trend')) chartType = 'line';

      // Detect Label Column and Value Column from headers
      let labelCol = sheetData.columns.find((c) => lower.includes(c.key) || lower.includes(c.label.toLowerCase()))?.key;
      let valueCol = sheetData.columns.find((c) => (lower.includes(c.key) || lower.includes(c.label.toLowerCase())) && c.type === 'number')?.key;

      // Smart Defaults if not explicitly matched
      if (!labelCol) {
        // Look for string or date column
        const stringCol = sheetData.columns.find((c) => c.key === 'data1' || c.key === 'category' || c.type === 'string');
        labelCol = stringCol ? stringCol.key : sheetData.columns[0]?.key || 'category';
      }

      if (!valueCol) {
        const numCol = sheetData.columns.find((c) => c.key === 'count' || c.type === 'number');
        valueCol = numCol ? numCol.key : 'count';
      }

      const labelLabel = sheetData.columns.find((c) => c.key === labelCol)?.label || labelCol;
      const valueLabel = sheetData.columns.find((c) => c.key === valueCol)?.label || valueCol;

      const widget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        title: `${chartType.toUpperCase()} Chart: ${valueLabel} by ${labelLabel}`,
        type: 'chart',
        chartType,
        labelColumn: labelCol,
        valueColumn: valueCol,
        aggregation: 'SUM',
        customColors: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#3b82f6', '#10b981'],
      };

      return {
        message: `Generated a ${chartType} chart widget plotting ${valueLabel} grouped by ${labelLabel}! Check the Dashboard tab to view your chart.`,
        actionType: 'CREATE_WIDGET',
        widget,
      };
    }

    // --- INTENT B: KPI STAT CARD (e.g., "total count", "show total summary") ---
    if (lower.includes('total') || lower.includes('summary') || lower.includes('kpi') || lower.includes('average')) {
      const numCol = sheetData.columns.find((c) => lower.includes(c.key) || lower.includes(c.label.toLowerCase()))?.key || 'count';
      const agg = lower.includes('average') ? 'AVERAGE' : 'SUM';

      const widget: DashboardWidget = {
        id: `widget-kpi-${Date.now()}`,
        title: `${agg} of ${numCol}`,
        type: 'kpi',
        kpiConfig: {
          metricColumn: numCol,
          aggregation: agg,
          format: 'number',
          iconName: agg === 'SUM' ? 'TrendingUp' : 'Activity',
        },
      };

      return {
        message: `Created KPI Summary Card calculating ${agg} of ${numCol}!`,
        actionType: 'CREATE_WIDGET',
        widget,
      };
    }

    // --- INTENT C: ADD ROW ENTRY (e.g., "add a row date 2026-08-15 category Cloud data1 Storage D count 120") ---
    if (lower.includes('add row') || lower.includes('insert row') || lower.includes('new row') || lower.includes('add data')) {
      const newRow: Record<string, { raw: string | number }> = {};
      
      // Default template
      sheetData.columns.forEach((col) => {
        if (col.type === 'number') newRow[col.key] = { raw: 100 };
        else if (col.type === 'date') newRow[col.key] = { raw: new Date().toISOString().split('T')[0] };
        else newRow[col.key] = { raw: 'New Entry' };
      });

      // Try parsing numbers from prompt
      const numMatch = prompt.match(/\b\d+\b/);
      if (numMatch) {
        const numCol = sheetData.columns.find((c) => c.type === 'number')?.key;
        if (numCol) newRow[numCol] = { raw: parseInt(numMatch[0], 10) };
      }

      // Check category/data1 values in prompt
      if (lower.includes('software')) newRow['category'] = { raw: 'Software' };
      else if (lower.includes('hardware')) newRow['category'] = { raw: 'Hardware' };
      else if (lower.includes('cloud')) newRow['category'] = { raw: 'Cloud' };

      const updatedRows = [...sheetData.rows, newRow];

      return {
        message: 'Successfully added a new record row to your spreadsheet!',
        actionType: 'ADD_ROW',
        updatedRows,
      };
    }

    // --- INTENT D: CONDITIONAL HIGHLIGHT / FILTER ---
    if (lower.includes('highlight') || lower.includes('greater than') || lower.includes('>')) {
      const numCol = sheetData.columns.find((c) => c.type === 'number')?.key || 'count';
      const numMatch = prompt.match(/\b\d+\b/);
      const targetValue = numMatch ? parseInt(numMatch[0], 10) : 100;

      return {
        message: `Highlighted rows where ${numCol} is greater than ${targetValue} in light green!`,
        actionType: 'FORMAT_COLUMN',
        highlightCondition: {
          column: numCol,
          operator: '>',
          value: targetValue,
          bgColor: 'rgba(34, 197, 94, 0.25)', // soft green highlight
        },
      };
    }

    // Default Fallback
    return {
      message: `I analyzed your prompt: "${prompt}". I can help you create circular pie charts, bar charts, add new entries, format cells, or generate KPI metrics! Try: "Create a circular pie chart for Data1 and Count"`,
      actionType: 'NONE',
    };
  }

  /**
   * Call Gemini API endpoint if API Key is configured
   */
  private static async callGeminiApi(
    prompt: string,
    sheetData: SheetData,
    apiKey: string
  ): Promise<AiActionResponse | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const schemaInfo = {
      columns: sheetData.columns,
      sampleRows: sheetData.rows.slice(0, 3),
    };

    const systemPrompt = `You are an AI assistant for a spreadsheet & dashboard app. The user gives a prompt: "${prompt}".
Sheet metadata: ${JSON.stringify(schemaInfo)}.
Respond with JSON only matching this format:
{
  "message": "User-friendly description of action",
  "actionType": "CREATE_WIDGET" | "ADD_ROW" | "FORMAT_COLUMN" | "NONE",
  "widget": {
    "title": "Chart Title",
    "type": "chart" | "kpi",
    "chartType": "pie" | "bar" | "line" | "doughnut",
    "labelColumn": "columnKey",
    "valueColumn": "columnKey",
    "aggregation": "SUM"
  }
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResp) return null;

    const cleaned = textResp.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.widget) {
      parsed.widget.id = `widget-gemini-${Date.now()}`;
      parsed.widget.customColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];
    }

    return parsed;
  }
}
