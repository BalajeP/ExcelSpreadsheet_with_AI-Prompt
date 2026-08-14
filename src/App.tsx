import React, { useState, useEffect } from 'react';
import type { SheetData, WorkbookData, DashboardWidget, AppSettings } from './types';
import { StorageService, createNewSheet } from './services/storageService';
import { ExportService } from './services/exportService';
import { HeaderToolbar } from './components/HeaderToolbar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { DashboardView } from './components/DashboardView';
import { AiSidebar } from './components/AiSidebar';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'dashboard'>('sheet');
  const [workbookData, setWorkbookData] = useState<WorkbookData>(StorageService.loadWorkbookData);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(StorageService.loadWidgets);
  const [settings, setSettings] = useState<AppSettings>(StorageService.loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightCondition, setHighlightCondition] = useState<any>(null);

  // Active sheet reference
  const activeSheet =
    workbookData.sheets.find((s) => s.id === workbookData.activeSheetId) ||
    workbookData.sheets[0] ||
    createNewSheet(1);

  // Active cell tracking for formatting ribbon commands
  const [activeCellLocation, setActiveCellLocation] = useState<{
    rowIndex: number;
    colKey: string;
    style?: any;
    raw?: string | number;
  }>({
    rowIndex: 0,
    colKey: activeSheet.columns[0]?.key || 'a',
  });

  // Auto-save workbook data on change
  useEffect(() => {
    StorageService.saveWorkbookData(workbookData);
  }, [workbookData]);

  // Auto-save dashboard widgets on change
  useEffect(() => {
    StorageService.saveWidgets(widgets);
  }, [widgets]);

  // Auto-save settings
  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Worksheet Handlers
  const handleSelectSheet = (sheetId: string) => {
    setWorkbookData((prev) => ({ ...prev, activeSheetId: sheetId }));
  };

  const handleAddSheet = () => {
    const nextNum = workbookData.sheets.length + 1;
    const newSheet = createNewSheet(nextNum);
    setWorkbookData((prev) => ({
      activeSheetId: newSheet.id,
      sheets: [...prev.sheets, newSheet],
    }));
  };

  const handleRenameSheet = (sheetId: string, newTitle: string) => {
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === sheetId ? { ...s, title: newTitle } : s)),
    }));
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (workbookData.sheets.length <= 1) {
      alert('Cannot delete the only remaining worksheet.');
      return;
    }

    if (!confirm('Are you sure you want to delete this worksheet?')) return;

    const filtered = workbookData.sheets.filter((s) => s.id !== sheetId);
    const newActiveId = workbookData.activeSheetId === sheetId ? filtered[0].id : workbookData.activeSheetId;

    setWorkbookData({
      activeSheetId: newActiveId,
      sheets: filtered,
    });
  };

  const handleUpdateActiveSheet = (updatedSheet: SheetData) => {
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === updatedSheet.id ? updatedSheet : s)),
    }));
  };

  const handleWidgetCreated = (newWidget: DashboardWidget) => {
    setWidgets((prev) => [newWidget, ...prev]);
    setActiveTab('dashboard');
  };

  const handleRowsUpdated = (updatedRows: any[]) => {
    handleUpdateActiveSheet({ ...activeSheet, rows: updatedRows });
  };

  const handleExportPdf = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      ExportService.exportDashboardToPdf('dashboard-print-container', activeSheet.title || 'Analytics_Dashboard');
    }, 300);
  };

  const handleResetData = () => {
    const { workbookData: defaultWorkbook, widgets: defaultWidgets } = StorageService.resetToDefault();
    setWorkbookData(defaultWorkbook);
    setWidgets(defaultWidgets);
    setHighlightCondition(null);
  };

  const handleAddSamplePieChart = () => {
    const firstColKey = activeSheet.columns[0]?.key || 'a';
    const numColKey = activeSheet.columns.find((c) => c.key !== firstColKey)?.key || activeSheet.columns[1]?.key || 'b';

    const pieWidget: DashboardWidget = {
      id: `widget-pie-${Date.now()}`,
      title: `Circular Pie Chart: Count by ${firstColKey.toUpperCase()}`,
      type: 'chart',
      chartType: 'pie',
      labelColumn: firstColKey,
      valueColumn: numColKey,
      aggregation: 'SUM',
      customColors: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4'],
    };
    setWidgets((prev) => [pieWidget, ...prev]);
    setActiveTab('dashboard');
  };

  const handleAddSampleBarChart = () => {
    const firstColKey = activeSheet.columns[0]?.key || 'a';
    const numColKey = activeSheet.columns.find((c) => c.key !== firstColKey)?.key || activeSheet.columns[1]?.key || 'b';

    const barWidget: DashboardWidget = {
      id: `widget-bar-${Date.now()}`,
      title: `Column / Bar Chart: Summary by ${firstColKey.toUpperCase()}`,
      type: 'chart',
      chartType: 'bar',
      labelColumn: firstColKey,
      valueColumn: numColKey,
      aggregation: 'SUM',
      customColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    };
    setWidgets((prev) => [barWidget, ...prev]);
    setActiveTab('dashboard');
  };

  // --- CELL FORMATTING RIBBON HANDLERS ---
  const updateActiveCellStyle = (styleModifier: (existingStyle: any) => any) => {
    const { rowIndex, colKey } = activeCellLocation;
    const newRows = [...activeSheet.rows];
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

    handleUpdateActiveSheet({ ...activeSheet, rows: newRows });
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
    const newRows = [...activeSheet.rows];
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

    handleUpdateActiveSheet({ ...activeSheet, rows: newRows });
  };

  const handleAutoSum = () => {
    const { rowIndex, colKey } = activeCellLocation;
    const newRows = [...activeSheet.rows];
    if (!newRows[rowIndex]) return;

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colKey]: {
        ...newRows[rowIndex][colKey],
        raw: `=SUM(${colKey.toUpperCase()})`,
      },
    };

    handleUpdateActiveSheet({ ...activeSheet, rows: newRows });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-text">
      {/* Top Header Navigation & Action Bar */}
      <HeaderToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheetData={activeSheet}
        onImport={(imported) => {
          handleUpdateActiveSheet(imported);
          setActiveTab('sheet');
        }}
        onExportPdf={handleExportPdf}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        onAddPieChart={handleAddSamplePieChart}
        onAddBarChart={handleAddSampleBarChart}
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
              sheetData={activeSheet}
              sheets={workbookData.sheets}
              activeSheetId={workbookData.activeSheetId}
              onSelectSheet={handleSelectSheet}
              onAddSheet={handleAddSheet}
              onRenameSheet={handleRenameSheet}
              onDeleteSheet={handleDeleteSheet}
              onUpdateSheetData={handleUpdateActiveSheet}
              onImport={(imported) => {
                handleUpdateActiveSheet(imported);
                setActiveTab('sheet');
              }}
              onSelectCell={setActiveCellLocation}
              highlightCondition={highlightCondition}
            />
          ) : (
            <DashboardView
              sheetData={activeSheet}
              widgets={widgets}
              onUpdateWidgets={setWidgets}
              onAddSamplePieChart={handleAddSamplePieChart}
            />
          )}
        </main>

        {/* AI Copilot Side Prompt Panel */}
        <AiSidebar
          sheetData={activeSheet}
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
