import React, { useState, useMemo } from 'react';
import type { SheetData, GridRow, ColumnMeta } from '../types';
import { Plus, Trash2, Search, Hash, Type, Calendar, Edit2, Check, X } from 'lucide-react';

interface SpreadsheetGridProps {
  sheetData: SheetData;
  onUpdateSheetData: (updatedSheet: SheetData) => void;
  highlightCondition?: {
    column: string;
    operator: '>' | '<' | '==' | 'contains';
    value: string | number;
    bgColor: string;
  };
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheetData,
  onUpdateSheetData,
  highlightCondition,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Column Header Editing State
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editColLabel, setEditColLabel] = useState('');

  // Handle cell edit save
  const handleSaveCell = (rowIndex: number, colKey: string) => {
    if (!editingCell) return;

    const newRows = [...sheetData.rows];
    const column = sheetData.columns.find((c) => c.key === colKey);
    let parsedVal: string | number = editValue;

    if (column?.type === 'number' && editValue !== '' && !editValue.startsWith('=')) {
      const num = Number(editValue);
      if (!isNaN(num)) parsedVal = num;
    }

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colKey]: {
        ...newRows[rowIndex][colKey],
        raw: parsedVal,
      },
    };

    onUpdateSheetData({ ...sheetData, rows: newRows });
    setEditingCell(null);
  };

  // Save Column Header Rename
  const handleSaveColumnHeader = (colKey: string) => {
    if (!editColLabel.trim()) {
      setEditingColKey(null);
      return;
    }

    const updatedCols = sheetData.columns.map((c) => {
      if (c.key === colKey) {
        return { ...c, label: editColLabel.trim() };
      }
      return c;
    });

    onUpdateSheetData({ ...sheetData, columns: updatedCols });
    setEditingColKey(null);
  };

  // Delete Column
  const handleDeleteColumn = (colKey: string) => {
    if (sheetData.columns.length <= 1) {
      alert('Cannot delete the last column.');
      return;
    }

    if (!confirm(`Are you sure you want to delete column "${colKey}"?`)) return;

    const updatedCols = sheetData.columns.filter((c) => c.key !== colKey);
    const updatedRows = sheetData.rows.map((row) => {
      const copy = { ...row };
      delete copy[colKey];
      return copy;
    });

    onUpdateSheetData({
      ...sheetData,
      columns: updatedCols,
      rows: updatedRows,
    });
  };

  // Evaluate cell values (formulas vs raw)
  const evaluateCellValue = (row: GridRow, colKey: string): string | number => {
    const cell = row[colKey];
    if (!cell) return '';
    const rawStr = String(cell.raw ?? '');

    if (rawStr.startsWith('=')) {
      const formula = rawStr.substring(1).trim().toUpperCase();
      if (formula.startsWith('SUM(')) {
        const targetCol = formula.match(/SUM\(([^)]+)\)/i)?.[1]?.toLowerCase() || colKey;
        const total = sheetData.rows.reduce((acc, r) => {
          const val = Number(r[targetCol]?.raw ?? 0);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        return total;
      }
      if (formula.startsWith('AVERAGE(')) {
        const targetCol = formula.match(/AVERAGE\(([^)]+)\)/i)?.[1]?.toLowerCase() || colKey;
        const nums = sheetData.rows.map((r) => Number(r[targetCol]?.raw ?? 0)).filter((n) => !isNaN(n));
        return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : 0;
      }
    }

    return cell.raw;
  };

  // Add new row
  const handleAddRow = () => {
    const newRow: GridRow = {};
    sheetData.columns.forEach((col) => {
      if (col.type === 'number') newRow[col.key] = { raw: 0 };
      else if (col.type === 'date') newRow[col.key] = { raw: new Date().toISOString().split('T')[0] };
      else newRow[col.key] = { raw: 'New Record' };
    });

    onUpdateSheetData({
      ...sheetData,
      rows: [...sheetData.rows, newRow],
    });
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const updated = sheetData.rows.filter((_, i) => i !== index);
    onUpdateSheetData({ ...sheetData, rows: updated });
  };

  // Add new column
  const handleAddColumn = () => {
    const colName = prompt('Enter New Column Header Name:', 'New Column');
    if (!colName) return;

    const key = colName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCol: ColumnMeta = {
      key,
      label: colName,
      type: 'string',
      width: 140,
    };

    const newRows = sheetData.rows.map((r) => ({
      ...r,
      [key]: { raw: '-' },
    }));

    onUpdateSheetData({
      ...sheetData,
      columns: [...sheetData.columns, newCol],
      rows: newRows,
    });
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return sheetData.rows;
    const term = searchTerm.toLowerCase();
    return sheetData.rows.filter((row) =>
      sheetData.columns.some((col) => {
        const val = String(row[col.key]?.raw ?? '').toLowerCase();
        return val.includes(term);
      })
    );
  }, [sheetData, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Grid Control Bar */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cells, categories, values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            Add Column
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-800/90 sticky top-0 z-10 border-b border-slate-700 text-slate-300 font-semibold select-none">
              <th className="w-12 px-3 py-2.5 text-center text-slate-500 border-r border-slate-700/60">#</th>
              {sheetData.columns.map((col) => {
                const isEditingCol = editingColKey === col.key;

                return (
                  <th
                    key={col.key}
                    className="px-4 py-2 border-r border-slate-700/60 min-w-[140px] group relative"
                    style={{ width: col.width }}
                  >
                    {isEditingCol ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editColLabel}
                          onChange={(e) => setEditColLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveColumnHeader(col.key);
                            if (e.key === 'Escape') setEditingColKey(null);
                          }}
                          className="w-full bg-slate-950 text-indigo-200 border border-indigo-500 rounded px-2 py-0.5 text-xs outline-none"
                        />
                        <button
                          onClick={() => handleSaveColumnHeader(col.key)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingColKey(null)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <span
                          onDoubleClick={() => {
                            setEditingColKey(col.key);
                            setEditColLabel(col.label);
                          }}
                          className="font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer hover:text-indigo-300 transition truncate"
                          title="Double click to rename column header"
                        >
                          {col.type === 'number' && <Hash className="w-3 h-3 text-indigo-400" />}
                          {col.type === 'date' && <Calendar className="w-3 h-3 text-pink-400" />}
                          {col.type === 'string' && <Type className="w-3 h-3 text-emerald-400" />}
                          {col.label}
                        </span>

                        {/* Hover Actions: Edit / Delete Column */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                          <button
                            onClick={() => {
                              setEditingColKey(col.key);
                              setEditColLabel(col.label);
                            }}
                            className="text-slate-400 hover:text-indigo-300 p-0.5"
                            title="Rename column"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(col.key)}
                            className="text-slate-400 hover:text-rose-400 p-0.5"
                            title="Delete column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="w-12 px-2 py-2.5 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-800/40 transition-colors group">
                {/* Row Index */}
                <td className="px-3 py-2 text-center text-slate-500 font-mono text-[11px] border-r border-slate-800 select-none">
                  {rowIndex + 1}
                </td>

                {/* Columns */}
                {sheetData.columns.map((col) => {
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === col.key;
                  const displayValue = evaluateCellValue(row, col.key);

                  // Highlight logic
                  let isHighlighted = false;
                  if (highlightCondition && highlightCondition.column === col.key) {
                    const rawNum = Number(row[col.key]?.raw);
                    const targetNum = Number(highlightCondition.value);
                    if (!isNaN(rawNum) && !isNaN(targetNum)) {
                      if (highlightCondition.operator === '>' && rawNum > targetNum) isHighlighted = true;
                      if (highlightCondition.operator === '<' && rawNum < targetNum) isHighlighted = true;
                    }
                  }

                  return (
                    <td
                      key={col.key}
                      onClick={() => {
                        setEditingCell({ rowIndex, colKey: col.key });
                        setEditValue(String(row[col.key]?.raw ?? ''));
                      }}
                      className={`px-4 py-2 border-r border-slate-800/80 cursor-pointer transition ${
                        isHighlighted ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : ''
                      } hover:bg-indigo-500/10`}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(rowIndex, col.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCell(rowIndex, col.key);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full bg-indigo-950 text-indigo-100 border border-indigo-500 rounded px-2 py-0.5 text-xs outline-none shadow-inner"
                        />
                      ) : (
                        <span className={`block truncate ${col.type === 'number' ? 'font-mono text-right' : ''}`}>
                          {String(displayValue)}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Delete Row button */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => handleDeleteRow(rowIndex)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Info */}
      <div className="px-4 py-2 bg-slate-850 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
        <span>Total Records: {sheetData.rows.length} rows</span>
        <span>Double-click column header to rename • Click cell to edit • Hover to delete row/column</span>
      </div>
    </div>
  );
};
