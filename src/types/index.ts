export interface CellValue {
  raw: string | number;
  formatted?: string;
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    bgColor?: string;
    align?: 'left' | 'center' | 'right';
    fontSize?: string;
    fontFamily?: string;
  };
}

export type GridRow = Record<string, CellValue>;

export interface ColumnMeta {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
  width?: number;
}

export interface SheetData {
  id: string;
  title: string;
  columns: ColumnMeta[];
  rows: GridRow[];
}

export interface WorkbookData {
  activeSheetId: string;
  sheets: SheetData[];
}

export type ChartType = 'pie' | 'doughnut' | 'bar' | 'line';

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'kpi';
  chartType?: ChartType;
  labelColumn?: string;
  valueColumn?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVERAGE' | 'MAX' | 'MIN';
  kpiConfig?: {
    metricColumn: string;
    aggregation: 'SUM' | 'COUNT' | 'AVERAGE' | 'MAX' | 'MIN';
    format?: 'number' | 'currency' | 'percent';
    iconName?: string;
  };
  customColors?: string[];
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  actionTaken?: string;
  widgetCreated?: DashboardWidget;
}

export interface AiActionResponse {
  message: string;
  actionType: 'CREATE_WIDGET' | 'UPDATE_CELLS' | 'ADD_ROW' | 'FORMAT_COLUMN' | 'FILTER_DATA' | 'NONE';
  widget?: DashboardWidget;
  updatedRows?: GridRow[];
  highlightColumn?: string;
  highlightCondition?: {
    column: string;
    operator: '>' | '<' | '==' | 'contains';
    value: string | number;
    bgColor: string;
  };
}

export interface AppSettings {
  geminiApiKey: string;
  theme: 'dark' | 'light';
  autoSave: boolean;
}
