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
