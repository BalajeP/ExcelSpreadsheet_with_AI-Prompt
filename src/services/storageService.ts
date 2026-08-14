import type { SheetData, DashboardWidget, AppSettings } from '../types';

const STORAGE_KEYS = {
  SHEET_DATA: 'ai_excel_sheet_data_v1',
  DASHBOARD_WIDGETS: 'ai_excel_widgets_v1',
  SETTINGS: 'ai_excel_settings_v1',
};

export const INITIAL_SHEET_DATA: SheetData = {
  id: 'sheet-1',
  title: 'Sales & Inventory Overview 2026',
  columns: [
    { key: 'date', label: 'Date', type: 'date', width: 130 },
    { key: 'category', label: 'Category', type: 'string', width: 140 },
    { key: 'data1', label: 'Data1', type: 'string', width: 160 },
    { key: 'count', label: 'Count', type: 'number', width: 110 },
    { key: 'status', label: 'Status', type: 'string', width: 130 },
  ],
  rows: [
    {
      date: { raw: '2026-08-01' },
      category: { raw: 'Hardware' },
      data1: { raw: 'Server Rack A' },
      count: { raw: 150 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-02' },
      category: { raw: 'Software' },
      data1: { raw: 'License Pro B' },
      count: { raw: 45 },
      status: { raw: 'Pending' },
    },
    {
      date: { raw: '2026-08-03' },
      category: { raw: 'Hardware' },
      data1: { raw: 'Server Rack A' },
      count: { raw: 210 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-04' },
      category: { raw: 'Cloud' },
      data1: { raw: 'Storage Node C' },
      count: { raw: 85 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-05' },
      category: { raw: 'Software' },
      data1: { raw: 'License Enterprise' },
      count: { raw: 320 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-06' },
      category: { raw: 'Networking' },
      data1: { raw: 'Router Fiber X' },
      count: { raw: 95 },
      status: { raw: 'Pending' },
    },
    {
      date: { raw: '2026-08-07' },
      category: { raw: 'Cloud' },
      data1: { raw: 'Storage Node C' },
      count: { raw: 140 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-08' },
      category: { raw: 'Software' },
      data1: { raw: 'License Pro B' },
      count: { raw: 110 },
      status: { raw: 'Completed' },
    },
    {
      date: { raw: '2026-08-09' },
      category: { raw: 'Hardware' },
      data1: { raw: 'Switch 48-Port' },
      count: { raw: 75 },
      status: { raw: 'In Progress' },
    },
    {
      date: { raw: '2026-08-10' },
      category: { raw: 'Networking' },
      data1: { raw: 'Router Fiber X' },
      count: { raw: 180 },
      status: { raw: 'Completed' },
    },
  ],
};

export const INITIAL_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-pie-1',
    title: 'Distribution of Count by Data1 Category',
    type: 'chart',
    chartType: 'pie',
    labelColumn: 'data1',
    valueColumn: 'count',
    aggregation: 'SUM',
    customColors: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4'],
  },
  {
    id: 'widget-kpi-1',
    title: 'Total Metric Count',
    type: 'kpi',
    kpiConfig: {
      metricColumn: 'count',
      aggregation: 'SUM',
      format: 'number',
      iconName: 'Hash',
    },
  },
  {
    id: 'widget-bar-1',
    title: 'Count Breakdown by Main Category',
    type: 'chart',
    chartType: 'bar',
    labelColumn: 'category',
    valueColumn: 'count',
    aggregation: 'SUM',
    customColors: ['#3b82f6'],
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  theme: 'dark',
  autoSave: true,
};

export class StorageService {
  static loadSheetData(): SheetData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_DATA);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading sheet data from storage', e);
    }
    return INITIAL_SHEET_DATA;
  }

  static saveSheetData(sheetData: SheetData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_DATA, JSON.stringify(sheetData));
    } catch (e) {
      console.error('Error saving sheet data to storage', e);
    }
  }

  static loadWidgets(): DashboardWidget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DASHBOARD_WIDGETS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading dashboard widgets from storage', e);
    }
    return INITIAL_WIDGETS;
  }

  static saveWidgets(widgets: DashboardWidget[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_WIDGETS, JSON.stringify(widgets));
    } catch (e) {
      console.error('Error saving dashboard widgets to storage', e);
    }
  }

  static loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading settings from storage', e);
    }
    return INITIAL_SETTINGS;
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to storage', e);
    }
  }

  static resetToDefault(): { sheetData: SheetData; widgets: DashboardWidget[] } {
    localStorage.removeItem(STORAGE_KEYS.SHEET_DATA);
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_WIDGETS);
    return { sheetData: INITIAL_SHEET_DATA, widgets: INITIAL_WIDGETS };
  }
}
