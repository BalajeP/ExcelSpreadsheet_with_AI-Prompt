import React, { useState, useEffect } from 'react';
import type { SheetData, DashboardWidget, AppSettings } from './types';
import { StorageService } from './services/storageService';
import { ExportService } from './services/exportService';
import { HeaderToolbar } from './components/HeaderToolbar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { DashboardView } from './components/DashboardView';
import { AiSidebar } from './components/AiSidebar';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'dashboard'>('sheet');
  const [sheetData, setSheetData] = useState<SheetData>(StorageService.loadSheetData);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(StorageService.loadWidgets);
  const [settings, setSettings] = useState<AppSettings>(StorageService.loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightCondition, setHighlightCondition] = useState<any>(null);

  // Active cell tracking for formatting ribbon commands
  const [activeCellLocation, setActiveCellLocation] = useState<{
    rowIndex: number;
    colKey: string;
    style?: any;
    raw?: string | number;
  }>({
    rowIndex: 0,
    colKey: sheetData.columns[0]?.key || 'a',
  });

  // Auto-save sheet data on change
  useEffect(() => {
    StorageService.saveSheetData(sheetData);
  }, [sheetData]);

  // Auto-save dashboard widgets on change
  useEffect(() => {
    StorageService.saveWidgets(widgets);
  }, [widgets]);

  // Auto-save settings
  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  const handleUpdateSheetData = (newSheet: SheetData) => {
    setSheetData(newSheet);
  };

  const handleWidgetCreated = (newWidget: DashboardWidget) => {
    setWidgets((prev) => [newWidget, ...prev]);
    setActiveTab('dashboard'); // Auto switch to Dashboard tab so user sees the new chart!
  };

  const handleRowsUpdated = (updatedRows: any[]) => {
    setSheetData((prev) => ({ ...prev, rows: updatedRows }));
  };

  const handleExportPdf = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      ExportService.exportDashboardToPdf('dashboard-print-container', sheetData.title || 'Analytics_Dashboard');
    }, 300);
  };

  const handleResetData = () => {
    const { sheetData: defaultSheet, widgets: defaultWidgets } = StorageService.resetToDefault();
    setSheetData(defaultSheet);
    setWidgets(defaultWidgets);
    setHighlightCondition(null);
  };

  const handleAddSamplePieChart = () => {
    const pieWidget: DashboardWidget = {
      id: `widget-pie-${Date.now()}`,
      title: 'Circular Pie Chart: Count by Data1',
      type: 'chart',
      chartType: 'pie',
      labelColumn: 'data1',
      valueColumn: 'count',
      aggregation: 'SUM',
      customColors: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4'],
    };
    setWidgets((prev) => [pieWidget, ...prev]);
  };

  // --- CELL FORMATTING RIBBON HANDLERS ---
  const updateActiveCellStyle = (styleModifier: (existingStyle: any) => any) => {
    const { rowIndex, colKey } = activeCellLocation;
    const newRows = [...sheetData.rows];
    if (!newRows[rowIndex]) return;

    const currentCell = newRows[rowIndex][colKey] || { raw: '' };
    const newStyle = styleModifier(currentCell.style || {});

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colKey]: {
        ...currentCell,
        style: newStyle,
      },
    };

    setSheetData({ ...sheetData, rows: newRows });
  };

  const handleToggleBold = () => {
    updateActiveCellStyle((style) => ({ ...style, bold: !style.bold }));
  };

  const handleToggleItalic = () => {
    updateActiveCellStyle((style) => ({ ...style, italic: !style.italic }));
  };

  const handleToggleUnderline = () => {
    updateActiveCellStyle((style) => ({ ...style, underline: !style.underline }));
  };

  const handleSetAlign = (align: 'left' | 'center' | 'right') => {
    updateActiveCellStyle((style) => ({ ...style, align }));
  };

  const handleSetCellStyle = (styleName: 'Normal' | 'Bad' | 'Good' | 'Neutral') => {
    if (styleName === 'Normal') {
      updateActiveCellStyle((style) => ({ ...style, bgColor: undefined, color: undefined, bold: false }));
    } else if (styleName === 'Bad') {
      updateActiveCellStyle((style) => ({ ...style, bgColor: '#ffc7ce', color: '#9c0006', bold: true }));
    } else if (styleName === 'Good') {
      updateActiveCellStyle((style) => ({ ...style, bgColor: '#c6efce', color: '#006100', bold: true }));
    } else if (styleName === 'Neutral') {
      updateActiveCellStyle((style) => ({ ...style, bgColor: '#ffeb9c', color: '#9c6500', bold: true }));
    }
  };

  const handleSetFormat = (type: 'currency' | 'percent') => {
    const { rowIndex, colKey } = activeCellLocation;
    const newRows = [...sheetData.rows];
    if (!newRows[rowIndex]) return;

    const currentCell = newRows[rowIndex][colKey] || { raw: '' };
    let valStr = String(currentCell.raw ?? '');
    const num = Number(valStr.replace(/[^0-9.-]+/g, ''));

    if (!isNaN(num) && valStr !== '') {
      if (type === 'currency') {
        valStr = `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      } else if (type === 'percent') {
        valStr = `${num}%`;
      }
    }

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colKey]: {
        ...currentCell,
        raw: valStr,
      },
    };

    setSheetData({ ...sheetData, rows: newRows });
  };

  const handleAutoSum = () => {
    const { rowIndex, colKey } = activeCellLocation;
    const newRows = [...sheetData.rows];
    if (!newRows[rowIndex]) return;

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colKey]: {
        ...newRows[rowIndex][colKey],
        raw: `=SUM(${colKey.toUpperCase()})`,
      },
    };

    setSheetData({ ...sheetData, rows: newRows });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-text">
      {/* Top Header Navigation & Action Bar */}
      <HeaderToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheetData={sheetData}
        onImport={(imported) => {
          setSheetData(imported);
          setActiveTab('sheet');
        }}
        onExportPdf={handleExportPdf}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        activeCellStyle={activeCellLocation.style}
        onToggleBold={handleToggleBold}
        onToggleItalic={handleToggleItalic}
        onToggleUnderline={handleToggleUnderline}
        onSetAlign={handleSetAlign}
        onSetCellStyle={handleSetCellStyle}
        onSetFormat={handleSetFormat}
        onAutoSum={handleAutoSum}
      />

      {/* Main App Content Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main View Area (Sheet Grid or Dashboard) */}
        <main className="flex-1 p-4 overflow-auto">
          {activeTab === 'sheet' ? (
            <SpreadsheetGrid
              sheetData={sheetData}
              onUpdateSheetData={handleUpdateSheetData}
              onImport={(imported) => {
                setSheetData(imported);
                setActiveTab('sheet');
              }}
              onSelectCell={setActiveCellLocation}
              highlightCondition={highlightCondition}
            />
          ) : (
            <DashboardView
              sheetData={sheetData}
              widgets={widgets}
              onUpdateWidgets={setWidgets}
              onAddSamplePieChart={handleAddSamplePieChart}
            />
          )}
        </main>

        {/* AI Copilot Side Prompt Panel */}
        <AiSidebar
          sheetData={sheetData}
          widgets={widgets}
          apiKey={settings.geminiApiKey}
          onWidgetCreated={handleWidgetCreated}
          onRowsUpdated={handleRowsUpdated}
          onHighlightCondition={setHighlightCondition}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetData={handleResetData}
      />
    </div>
  );
};

export default App;
