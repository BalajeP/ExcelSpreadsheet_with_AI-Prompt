import type { SheetData, DashboardWidget, AppSettings, ColumnMeta, GridRow } from '../types';

const STORAGE_KEYS = {
  SHEET_DATA: 'ai_excel_sheet_data_v4',
  DASHBOARD_WIDGETS: 'ai_excel_widgets_v4',
  SETTINGS: 'ai_excel_settings_v4',
};

// Create 26 default Excel alphabet columns (A to Z)
const defaultExcelCols: ColumnMeta[] = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return {
    key: letter.toLowerCase(),
    label: letter,
    type: 'string',
    width: 95,
  };
});

// Create 35 default empty rows
const defaultExcelRows: GridRow[] = Array.from({ length: 35 }, () => {
  const row: GridRow = {};
  defaultExcelCols.forEach((col) => {
    row[col.key] = { raw: '' };
  });
  return row;
});

export const INITIAL_SHEET_DATA: SheetData = {
  id: 'sheet-1',
  title: 'Book1 - Excel',
  columns: defaultExcelCols,
  rows: defaultExcelRows,
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
