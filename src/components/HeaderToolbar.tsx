import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  LayoutDashboard, 
  Download, 
  FileUp, 
  FileText, 
  Settings as SettingsIcon, 
  DownloadCloud, 
  RefreshCw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Scissors,
  Copy,
  DollarSign,
  Percent,
  Sigma,
  Search
} from 'lucide-react';
import type { SheetData } from '../types';
import { ExportService } from '../services/exportService';

interface HeaderToolbarProps {
  activeTab: 'sheet' | 'dashboard';
  setActiveTab: (tab: 'sheet' | 'dashboard') => void;
  sheetData: SheetData;
  onImport: (newSheet: SheetData) => void;
  onExportPdf: () => void;
  onOpenSettings: () => void;
  onResetData: () => void;

  // Active cell formatting actions
  activeCellStyle?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
    bgColor?: string;
    color?: string;
  };
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetAlign?: (align: 'left' | 'center' | 'right') => void;
  onSetCellStyle?: (styleName: 'Normal' | 'Bad' | 'Good' | 'Neutral') => void;
  onSetFormat?: (type: 'currency' | 'percent') => void;
  onAutoSum?: () => void;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  activeTab,
  setActiveTab,
  sheetData,
  onImport,
  onExportPdf,
  onOpenSettings,
  onResetData,
  activeCellStyle,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetAlign,
  onSetCellStyle,
  onSetFormat,
  onAutoSum,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'Home' | 'Insert' | 'Page Layout' | 'Formulas' | 'Data' | 'Review' | 'View'>('Home');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('App icon installation is available when accessed via a PWA-supported browser (Chrome/Edge).');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await ExportService.importFile(file);
        if (imported) {
          onImport(imported);
        }
      } catch (err) {
        alert('Failed to import file. Make sure it is a valid .xlsx or .csv file.');
      }
    }
  };

  return (
    <header className="flex flex-col bg-[#107c41] text-white border-b border-[#0b5c30] shadow-md select-text">
      {/* 1. Top Green Excel Title Bar (Clean Microsoft Excel Header) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#107c41] text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-800 rounded font-black text-xs tracking-widest text-emerald-200 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>XLS</span>
          </div>
          <span className="font-semibold text-xs tracking-wide">
            Book1 - Excel
          </span>
        </div>

        {/* Quick Search & User Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:flex items-center">
            <Search className="w-3 h-3 absolute left-2 text-emerald-200" />
            <input
              type="text"
              placeholder="Tell me what you want to do..."
              className="bg-[#0e6e39] text-white text-[11px] placeholder-emerald-200 pl-7 pr-3 py-0.5 rounded outline-none border border-emerald-600 focus:border-white w-56"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-emerald-700 pl-2">
            <span className="text-[11px] font-semibold">Balaji P</span>
            <div className="w-5 h-5 rounded-full bg-emerald-900 border border-emerald-400 flex items-center justify-center text-[10px] font-bold">
              BP
            </div>
          </div>
        </div>
      </div>

      {/* 2. Classic Ribbon Menu Bar (File, Home, Insert, Page Layout...) */}
      <div className="flex items-center px-2 bg-[#107c41] text-white text-xs border-t border-emerald-700/60 overflow-x-auto scrollbar-none">
        <button className="px-3 py-1 bg-[#0b5c30] font-bold text-white uppercase tracking-wider text-[11px] hover:bg-[#084825]">
          File
        </button>

        {['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMenu(tab as any)}
            className={`px-3 py-1 font-medium text-[11px] transition ${
              activeMenu === tab && activeTab === 'sheet'
                ? 'bg-slate-100 text-[#107c41] font-bold rounded-t shadow-sm'
                : 'hover:bg-emerald-700/80 text-white'
            }`}
          >
            {tab}
          </button>
        ))}

        {/* Navigation & Action Triggers right inside Ribbon menu */}
        <div className="ml-auto flex items-center gap-1.5 py-0.5">
          {/* Sheet vs Dashboard View Toggle */}
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              activeTab === 'sheet'
                ? 'bg-white text-[#107c41] shadow-sm'
                : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            Grid View
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#107c41] shadow-sm'
                : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <LayoutDashboard className="w-3 h-3" />
            Dashboard
          </button>

          {/* RESET Button */}
          <button
            onClick={onResetData}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold rounded transition shadow-sm"
            title="Reset Sheet to Original State"
          >
            <RefreshCw className="w-3 h-3" />
            RESET
          </button>

          {/* Import File Button */}
          <label className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold rounded cursor-pointer transition shadow-sm">
            <FileUp className="w-3 h-3" />
            Import
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Export Excel Button */}
          <button
            onClick={() => ExportService.exportToExcel(sheetData)}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-semibold rounded transition shadow-sm"
            title="Export Excel .xlsx"
          >
            <Download className="w-3 h-3" />
            Export
          </button>

          {/* Export PDF Button */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold rounded transition shadow-sm"
            title="Export PDF"
          >
            <FileText className="w-3 h-3" />
            PDF
          </button>

          {/* PWA App Icon Install */}
          {!isAppInstalled && (
            <button
              onClick={handleInstallPwa}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-semibold rounded transition shadow-sm"
              title="Install App Icon"
            >
              <DownloadCloud className="w-3 h-3" />
              App Icon
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1 hover:bg-emerald-700 rounded transition text-white"
            title="Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Interactive Excel Ribbon Formatting Toolbar */}
      <div className="bg-slate-100 text-slate-800 px-3 py-1.5 flex flex-wrap items-center gap-4 text-xs border-b border-slate-300 shadow-inner overflow-x-auto scrollbar-none select-none">
        {/* Clipboard Group */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Paste">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Cut">
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Font Group */}
        <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3">
          <select className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] outline-none">
            <option>Calibri</option>
            <option>Segoe UI</option>
            <option>Arial</option>
            <option>Inter</option>
          </select>
          <select className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[11px] outline-none w-11">
            <option>11</option>
            <option>12</option>
            <option>14</option>
            <option>16</option>
          </select>

          {/* Bold Button */}
          <button
            onClick={onToggleBold}
            className={`p-1 rounded transition font-bold ${
              activeCellStyle?.bold ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-800'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Button */}
          <button
            onClick={onToggleItalic}
            className={`p-1 rounded transition italic ${
              activeCellStyle?.italic ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-800'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline Button */}
          <button
            onClick={onToggleUnderline}
            className={`p-1 rounded transition underline ${
              activeCellStyle?.underline ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-800'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button
            onClick={() => onSetAlign && onSetAlign('left')}
            className={`p-1 rounded transition ${
              activeCellStyle?.align === 'left' ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetAlign && onSetAlign('center')}
            className={`p-1 rounded transition ${
              activeCellStyle?.align === 'center' ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetAlign && onSetAlign('right')}
            className={`p-1 rounded transition ${
              activeCellStyle?.align === 'right' ? 'bg-indigo-200 text-indigo-900 border border-indigo-400' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Number Group ($ and %) */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button
            onClick={() => onSetFormat && onSetFormat('currency')}
            className="p-1 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-0.5"
            title="Format as Currency ($)"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
          </button>
          <button
            onClick={() => onSetFormat && onSetFormat('percent')}
            className="p-1 hover:bg-slate-200 rounded text-slate-700"
            title="Format as Percentage (%)"
          >
            <Percent className="w-3.5 h-3.5 text-indigo-700" />
          </button>
        </div>

        {/* Styles Group (Normal, Bad, Good, Neutral) */}
        <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3 hidden lg:flex">
          <button
            onClick={() => onSetCellStyle && onSetCellStyle('Normal')}
            className="px-2 py-0.5 bg-[#f2f2f2] hover:bg-[#e4e4e4] border border-[#d9d9d9] rounded text-[10px] text-slate-700 font-medium transition cursor-pointer"
            title="Normal Style"
          >
            Normal
          </button>
          <button
            onClick={() => onSetCellStyle && onSetCellStyle('Bad')}
            className="px-2 py-0.5 bg-[#ffc7ce] hover:bg-[#ffaab5] border border-[#ff8a9e] rounded text-[10px] text-[#9c0006] font-bold transition cursor-pointer"
            title="Bad Cell Style (Red)"
          >
            Bad
          </button>
          <button
            onClick={() => onSetCellStyle && onSetCellStyle('Good')}
            className="px-2 py-0.5 bg-[#c6efce] hover:bg-[#abedd8] border border-[#7ed68d] rounded text-[10px] text-[#006100] font-bold transition cursor-pointer"
            title="Good Cell Style (Green)"
          >
            Good
          </button>
          <button
            onClick={() => onSetCellStyle && onSetCellStyle('Neutral')}
            className="px-2 py-0.5 bg-[#ffeb9c] hover:bg-[#ffe270] border border-[#fcc02e] rounded text-[10px] text-[#9c6500] font-bold transition cursor-pointer"
            title="Neutral Cell Style (Yellow)"
          >
            Neutral
          </button>
        </div>

        {/* Editing / AutoSum Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onAutoSum}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-semibold text-[11px] transition cursor-pointer"
            title="Insert AutoSum =SUM()"
          >
            <Sigma className="w-3.5 h-3.5 text-emerald-700" />
            AutoSum
          </button>
        </div>
      </div>
    </header>
  );
};
