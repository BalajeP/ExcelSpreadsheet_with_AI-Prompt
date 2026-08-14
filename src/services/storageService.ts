import type { SheetData, DashboardWidget, AppSettings } from '../types';

const STORAGE_KEYS = {
  SHEET_DATA: 'ai_excel_sheet_data_v3',
  DASHBOARD_WIDGETS: 'ai_excel_widgets_v3',
  SETTINGS: 'ai_excel_settings_v3',
};

export const INITIAL_SHEET_DATA: SheetData = {
  id: 'sheet-1',
  title: 'Quality Analytics & Test Records',
  columns: [], // Clean start - no headers initially
  rows: [],    // Clean start - no rows initially
};

export const INITIAL_WIDGETS: DashboardWidget[] = [];

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
