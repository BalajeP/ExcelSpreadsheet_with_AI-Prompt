import type { SheetData, WorkbookData, DashboardWidget, AppSettings, ColumnMeta, GridRow } from '../types';

const STORAGE_KEYS = {
  WORKBOOK_DATA: 'ai_excel_workbook_data_v5',
  SHEET_DATA_LEGACY: 'ai_excel_sheet_data_v4',
  DASHBOARD_WIDGETS: 'ai_excel_widgets_v4',
  SETTINGS: 'ai_excel_settings_v4',
};

// Create 26 default Excel alphabet columns (A to Z)
export const createDefaultColumns = (): ColumnMeta[] =>
  Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return {
      key: letter.toLowerCase(),
      label: letter,
      type: 'string',
      width: 95,
    };
  });

// Create 35 default empty rows
export const createDefaultRows = (cols: ColumnMeta[]): GridRow[] =>
  Array.from({ length: 35 }, () => {
    const row: GridRow = {};
    cols.forEach((col) => {
      row[col.key] = { raw: '' };
    });
    return row;
  });

// Helper to construct a new blank Sheet
export const createNewSheet = (sheetNumber: number): SheetData => {
  const cols = createDefaultColumns();
  const rows = createDefaultRows(cols);
  return {
    id: `sheet-${Date.now()}-${sheetNumber}`,
    title: `Sheet${sheetNumber}`,
    columns: cols,
    rows: rows,
  };
};

export const INITIAL_WORKBOOK_DATA: WorkbookData = {
  activeSheetId: 'sheet-1',
  sheets: [
    {
      id: 'sheet-1',
      title: 'Sheet1',
      columns: createDefaultColumns(),
      rows: createDefaultRows(createDefaultColumns()),
    },
  ],
};

export const INITIAL_WIDGETS: DashboardWidget[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  theme: 'dark',
  autoSave: true,
};

export class StorageService {
  static loadWorkbookData(): WorkbookData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKBOOK_DATA);
      if (data) {
        const parsed: WorkbookData = JSON.parse(data);
        if (parsed.sheets && parsed.sheets.length > 0) return parsed;
      }

      // Check legacy single-sheet storage fallback
      const legacyData = localStorage.getItem(STORAGE_KEYS.SHEET_DATA_LEGACY);
      if (legacyData) {
        const legacySheet: SheetData = JSON.parse(legacyData);
        legacySheet.title = legacySheet.title || 'Sheet1';
        return {
          activeSheetId: legacySheet.id || 'sheet-1',
          sheets: [legacySheet],
        };
      }
    } catch (e) {
      console.error('Error reading workbook data from storage', e);
    }
    return INITIAL_WORKBOOK_DATA;
  }

  static saveWorkbookData(workbook: WorkbookData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKBOOK_DATA, JSON.stringify(workbook));
    } catch (e) {
      console.error('Error saving workbook data to storage', e);
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

  static resetToDefault(): { workbookData: WorkbookData; widgets: DashboardWidget[] } {
    localStorage.removeItem(STORAGE_KEYS.WORKBOOK_DATA);
    localStorage.removeItem(STORAGE_KEYS.SHEET_DATA_LEGACY);
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_WIDGETS);
    return { workbookData: INITIAL_WORKBOOK_DATA, widgets: INITIAL_WIDGETS };
  }
}
