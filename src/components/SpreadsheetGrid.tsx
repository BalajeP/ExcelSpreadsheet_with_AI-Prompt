import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SheetData, GridRow, ColumnMeta } from '../types';
import { Plus, Trash2, Search, Check } from 'lucide-react';

interface SpreadsheetGridProps {
  sheetData: SheetData;
  onUpdateSheetData: (updatedSheet: SheetData) => void;
  onImport?: (importedSheet: SheetData) => void;
  onSelectCell?: (cellInfo: { rowIndex: number; colKey: string; style?: any; raw?: string | number }) => void;
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
  onSelectCell,
  highlightCondition,
}) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection Mode State: 'cell' | 'column' | 'row'
  const [selectionMode, setSelectionMode] = useState<'cell' | 'column' | 'row'>('cell');
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Active Single Cell Focus State
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colKey: string }>({
    rowIndex: 0,
    colKey: sheetData.columns[0]?.key || 'a',
  });

  // Cell Editing State
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Column Header Editing State
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editColLabel, setEditColLabel] = useState('');

  // Selected cell address label (e.g. A1, B2)
  const activeColMeta = sheetData.columns.find((c) => c.key === selectedCell.colKey);
  const activeColIndex = sheetData.columns.findIndex((c) => c.key === selectedCell.colKey);
  const activeColLetter = activeColMeta ? activeColMeta.label : String.fromCharCode(65 + Math.max(0, activeColIndex));
  const cellAddressLabel = `${activeColLetter}${selectedCell.rowIndex + 1}`;

  const currentActiveCellObj = sheetData.rows[selectedCell.rowIndex]?.[selectedCell.colKey];
  const currentActiveCellRaw = currentActiveCellObj?.raw ?? '';

  useEffect(() => {
    if (onSelectCell) {
      onSelectCell({
        rowIndex: selectedCell.rowIndex,
        colKey: selectedCell.colKey,
        style: currentActiveCellObj?.style,
        raw: currentActiveCellRaw,
      });
    }
  }, [selectedCell, sheetData]);

  // Handle Full Column Click Selection (e.g. Clicking Column Header 'G')
  const handleSelectColumn = (colKey: string) => {
    setSelectionMode('column');
    setSelectedColKey(colKey);
    setSelectedRowIndex(null);
    setSelectedCell({ rowIndex: 0, colKey });
  };

  // Handle Full Row Click Selection (e.g. Clicking Row Header '2')
  const handleSelectRow = (rowIndex: number) => {
    setSelectionMode('row');
    setSelectedRowIndex(rowIndex);
    setSelectedColKey(null);
    setSelectedCell({ rowIndex, colKey: sheetData.columns[0]?.key || 'a' });
  };

  // Handle Keyboard Navigation (Tab, Enter, Shift+Tab, Shift+Enter, Arrow Keys)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return; // Don't intercept arrow keys while editing inside input

    const numRows = sheetData.rows.length;
    const numCols = sheetData.columns.length;
    const currentColIndex = sheetData.columns.findIndex((c) => c.key === selectedCell.colKey);

    if (e.key === 'Tab') {
      e.preventDefault();
      setSelectionMode('cell');
      if (e.shiftKey) {
        // Shift + Tab -> Move Left
        const prevColIndex = Math.max(0, currentColIndex - 1);
        setSelectedCell({ rowIndex: selectedCell.rowIndex, colKey: sheetData.columns[prevColIndex].key });
      } else {
        // Tab -> Move Right
        const nextColIndex = Math.min(numCols - 1, currentColIndex + 1);
        setSelectedCell({ rowIndex: selectedCell.rowIndex, colKey: sheetData.columns[nextColIndex].key });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setSelectionMode('cell');
      if (e.shiftKey) {
        // Shift + Enter -> Move Up
        const prevRowIndex = Math.max(0, selectedCell.rowIndex - 1);
        setSelectedCell({ rowIndex: prevRowIndex, colKey: selectedCell.colKey });
      } else {
        // Enter -> Move Down
        const nextRowIndex = Math.min(numRows - 1, selectedCell.rowIndex + 1);
        setSelectedCell({ rowIndex: nextRowIndex, colKey: selectedCell.colKey });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectionMode('cell');
      const prevRowIndex = Math.max(0, selectedCell.rowIndex - 1);
      setSelectedCell({ rowIndex: prevRowIndex, colKey: selectedCell.colKey });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectionMode('cell');
      const nextRowIndex = Math.min(numRows - 1, selectedCell.rowIndex + 1);
      setSelectedCell({ rowIndex: nextRowIndex, colKey: selectedCell.colKey });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectionMode('cell');
      const prevColIndex = Math.max(0, currentColIndex - 1);
      setSelectedCell({ rowIndex: selectedCell.rowIndex, colKey: sheetData.columns[prevColIndex].key });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectionMode('cell');
      const nextColIndex = Math.min(numCols - 1, currentColIndex + 1);
      setSelectedCell({ rowIndex: selectedCell.rowIndex, colKey: sheetData.columns[nextColIndex].key });
    }
  };

  // Handle Formula Bar Input
  const handleFormulaInputChange = (val: string) => {
    const newRows = [...sheetData.rows];
    if (!newRows[selectedCell.rowIndex]) {
      newRows[selectedCell.rowIndex] = {};
    }

    newRows[selectedCell.rowIndex] = {
      ...newRows[selectedCell.rowIndex],
      [selectedCell.colKey]: {
        ...newRows[selectedCell.rowIndex][selectedCell.colKey],
        raw: val,
      },
    };

    onUpdateSheetData({ ...sheetData, rows: newRows });
  };

  // Save Cell Edit
  const handleSaveCell = (rowIndex: number, colKey: string) => {
    if (!editingCell) return;

    const newRows = [...sheetData.rows];
    let parsedVal: string | number = editValue;

    if (editValue !== '' && !editValue.startsWith('=')) {
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
      newRow[col.key] = { raw: '' };
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
    const colName = prompt('Enter New Column Header Name:', `Col ${sheetData.columns.length + 1}`);
    if (!colName) return;

    const key = colName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCol: ColumnMeta = {
      key,
      label: colName,
      type: 'string',
      width: 95,
    };

    const newRows = sheetData.rows.map((r) => ({
      ...r,
      [key]: { raw: '' },
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
    <div
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full bg-white text-slate-900 rounded-none border border-slate-300 shadow-xl overflow-hidden font-sans select-text focus:outline-none"
    >
      {/* 1. Formula Bar (fx) matching Excel screenshot */}
      <div className="flex items-center gap-2 bg-[#f3f3f3] border-b border-[#d4d4d4] px-3 py-1.5 text-xs text-slate-800">
        {/* Cell Name Box e.g. A1 */}
        <div className="w-16 px-2 py-0.5 bg-white border border-[#c6c6c6] text-center font-semibold text-slate-800 text-[11px] shadow-inner select-none">
          {cellAddressLabel}
        </div>

        {/* fx Trigger & Buttons */}
        <div className="flex items-center gap-1 border-x border-[#d4d4d4] px-2 text-slate-500 font-serif italic text-xs select-none">
          <span className="font-bold text-slate-600 hover:text-emerald-700 cursor-pointer">fx</span>
        </div>

        {/* Formula Input Box */}
        <input
          type="text"
          value={String(currentActiveCellRaw)}
          onChange={(e) => handleFormulaInputChange(e.target.value)}
          placeholder="Enter text or formula starting with ="
          className="flex-1 bg-white border border-[#c6c6c6] rounded-none px-2.5 py-0.5 text-xs text-slate-900 font-mono outline-none focus:border-[#107c41] shadow-inner"
        />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#107c41] hover:bg-[#0e6e39] text-white text-[11px] font-semibold rounded shadow-sm transition"
          >
            <Plus className="w-3 h-3" />
            Row
          </button>
          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold rounded border border-slate-300 transition"
          >
            <Plus className="w-3 h-3 text-slate-600" />
            Col
          </button>
          <div className="relative w-36 ml-1 hidden sm:block">
            <Search className="w-3 h-3 absolute left-2 top-1.5 text-slate-400" />
            <input
              type="text"
              placeholder="Find..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded pl-6 pr-2 py-0.5 text-[11px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#107c41]"
            />
          </div>
        </div>
      </div>

      {/* 2. Authentic Excel Table Grid */}
      <div className="flex-1 overflow-auto bg-[#ffffff]">
        <table className="w-full border-collapse text-left text-xs table-fixed">
          <thead>
            <tr className="bg-[#f3f3f3] sticky top-0 z-10 border-b border-[#d4d4d4] text-[#444444] font-medium select-none">
              {/* Corner Cell */}
              <th className="w-10 px-2 py-1 text-center text-[#777777] bg-[#e6e6e6] border-r border-[#d4d4d4] font-semibold text-[11px]">
                ◢
              </th>

              {/* Column Headers (A, B, C... G... Z) */}
              {sheetData.columns.map((col) => {
                const isEditingCol = editingColKey === col.key;
                const isColHeaderSelected = selectedCell.colKey === col.key || (selectionMode === 'column' && selectedColKey === col.key);

                return (
                  <th
                    key={col.key}
                    onClick={() => handleSelectColumn(col.key)}
                    className={`px-2 py-1 border-r border-[#d4d4d4] min-w-[85px] group relative text-center text-[11px] font-semibold transition cursor-pointer ${
                      isColHeaderSelected ? 'bg-[#d9ebe1] text-[#107c41] font-bold border-b-2 border-b-[#107c41]' : 'hover:bg-[#e8e8e8]'
                    }`}
                    style={{ width: col.width || 90 }}
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
                          className="w-full bg-white text-slate-900 border border-[#107c41] px-1 py-0.5 text-xs outline-none shadow"
                        />
                        <button
                          onClick={() => handleSaveColumnHeader(col.key)}
                          className="text-emerald-700 hover:text-emerald-800 p-0.5"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingColKey(col.key);
                            setEditColLabel(col.label);
                          }}
                          className="flex-1 truncate"
                          title="Click to select column, double click to rename"
                        >
                          {col.label}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteColumn(col.key);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Delete Column"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="w-8 px-1 py-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e1e1]">
            {filteredRows.map((row, rowIndex) => {
              const isRowHeaderSelected = selectedCell.rowIndex === rowIndex || (selectionMode === 'row' && selectedRowIndex === rowIndex);

              return (
                <tr key={rowIndex} className="hover:bg-[#f5f5f5] transition-colors group">
                  {/* Row Number Header (1, 2, 3...) - Click selects entire row! */}
                  <td
                    onClick={() => handleSelectRow(rowIndex)}
                    className={`w-10 px-2 py-1 text-center font-mono text-[11px] border-r border-[#d4d4d4] select-none cursor-pointer transition ${
                      isRowHeaderSelected ? 'bg-[#d9ebe1] text-[#107c41] font-bold border-r-2 border-r-[#107c41]' : 'bg-[#f3f3f3] text-[#666666]'
                    }`}
                  >
                    {rowIndex + 1}
                  </td>

                  {/* Columns Data Cells */}
                  {sheetData.columns.map((col) => {
                    const isCellFocused = selectedCell.rowIndex === rowIndex && selectedCell.colKey === col.key;
                    const isColumnSelected = selectionMode === 'column' && selectedColKey === col.key;
                    const isRowSelected = selectionMode === 'row' && selectedRowIndex === rowIndex;

                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === col.key;
                    const cellObj = row[col.key];
                    const cellStyleObj = cellObj?.style || {};
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
                          setSelectionMode('cell');
                          setSelectedCell({ rowIndex, colKey: col.key });
                          setEditingCell({ rowIndex, colKey: col.key });
                          setEditValue(String(row[col.key]?.raw ?? ''));
                        }}
                        style={{
                          backgroundColor: isColumnSelected || isRowSelected ? '#d9d9d9' : cellStyleObj.bgColor,
                          color: cellStyleObj.color,
                          fontWeight: cellStyleObj.bold ? 'bold' : 'normal',
                          fontStyle: cellStyleObj.italic ? 'italic' : 'normal',
                          textDecoration: cellStyleObj.underline ? 'underline' : 'none',
                          textAlign: cellStyleObj.align || (typeof displayValue === 'number' ? 'right' : 'left'),
                        }}
                        className={`px-2 py-1 border-r border-b border-[#e1e1e1] cursor-pointer relative transition text-xs select-text ${
                          isCellFocused ? 'outline outline-2 outline-[#107c41] bg-[#eef7f2] z-10' : ''
                        } ${isColumnSelected || isRowSelected ? 'border-x border-x-[#107c41]' : ''} ${
                          isHighlighted ? 'bg-emerald-100 text-emerald-900 font-semibold' : ''
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value);
                              handleFormulaInputChange(e.target.value);
                            }}
                            onBlur={() => handleSaveCell(rowIndex, col.key)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCell(rowIndex, col.key);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-white text-slate-900 border border-[#107c41] px-1 py-0 text-xs outline-none shadow-inner"
                          />
                        ) : (
                          <span className="block truncate">
                            {String(displayValue)}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Delete Row Hover Button */}
                  <td className="px-1 py-1 text-center select-none">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition"
                      title="Delete Row"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Excel Bottom Status Bar (Sheet1, +, Ready, Zoom) */}
      <div className="px-3 py-1 bg-[#f3f3f3] border-t border-[#d4d4d4] text-[11px] text-slate-600 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* Active Sheet Tab */}
          <div className="flex items-center bg-white border-t-2 border-t-[#107c41] border-x border-[#d4d4d4] px-3 py-0.5 font-bold text-[#107c41] text-[11px]">
            Sheet1
          </div>
          <button onClick={handleAddColumn} className="p-0.5 hover:bg-slate-200 rounded text-slate-500" title="Add Sheet">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Ready</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
