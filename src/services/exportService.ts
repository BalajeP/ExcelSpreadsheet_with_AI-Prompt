import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { SheetData, GridRow, ColumnMeta } from '../types';

export class ExportService {
  /**
   * Exports sheet rows to a downloadable Excel file (.xlsx)
   */
  static exportToExcel(sheetData: SheetData, fileName = 'Spreadsheet_Export.xlsx'): void {
    try {
      // Build plain data array for SheetJS
      const headers = sheetData.columns.map((col) => col.label);
      const dataRows = sheetData.rows.map((row) => {
        const obj: Record<string, string | number> = {};
        sheetData.columns.forEach((col) => {
          const val = row[col.key]?.raw ?? '';
          obj[col.label] = val;
        });
        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.title || 'Sheet1');

      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Failed to export to Excel', error);
      alert('Failed to export Excel file. Please try again.');
    }
  }

  /**
   * Imports an uploaded .xlsx, .xls or .csv file and converts to SheetData
   */
  static async importFile(file: File): Promise<SheetData | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

          if (!jsonData || jsonData.length === 0) {
            resolve(null);
            return;
          }

          // Extract columns from first row keys
          const sampleRow = jsonData[0];
          const rawKeys = Object.keys(sampleRow);

          const columns: ColumnMeta[] = rawKeys.map((key) => {
            const firstVal = sampleRow[key];
            const isNum = typeof firstVal === 'number' || (!isNaN(Number(firstVal)) && firstVal !== '');
            const isDate = key.toLowerCase().includes('date') || (!isNaN(Date.parse(firstVal)) && isNaN(Number(firstVal)));
            
            return {
              key: key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              label: key,
              type: isNum ? 'number' : isDate ? 'date' : 'string',
              width: 140,
            };
          });

          const rows: GridRow[] = jsonData.map((item) => {
            const rowObj: GridRow = {};
            columns.forEach((col) => {
              const rawKey = rawKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '_') === col.key) || col.label;
              let val = item[rawKey];
              if (col.type === 'number' && val !== '') {
                val = Number(val);
              }
              rowObj[col.key] = { raw: val };
            });
            return rowObj;
          });

          resolve({
            id: 'imported-' + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            columns,
            rows,
          });
        } catch (err) {
          console.error('Error parsing file', err);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Captures the Dashboard DOM element and exports as a styled PDF report
   */
  static async exportDashboardToPdf(elementId: string, title = 'Analytics Dashboard Report'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('Dashboard view not found for PDF export.');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a', // sleek dark theme background
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }
}
