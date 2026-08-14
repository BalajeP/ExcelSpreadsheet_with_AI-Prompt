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
  Search,
  Sparkles
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
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  activeTab,
  setActiveTab,
  sheetData,
  onImport,
  onExportPdf,
  onOpenSettings,
  onResetData,
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
      {/* 1. Top Green Excel Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#107c41] text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-800 rounded font-black text-xs tracking-widest text-emerald-200 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>XLS</span>
          </div>
          <span className="font-semibold text-xs tracking-wide flex items-center gap-1.5">
            Book1 - Excel <span className="opacity-75 font-normal">(Quality Dashboard - Sankari QA)</span>
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
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

      {/* 3. Excel Ribbon Toolbar (Formatting tools matching Microsoft Excel screenshot) */}
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
          <button className="p-1 font-bold hover:bg-slate-200 rounded text-slate-800" title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 italic hover:bg-slate-200 rounded text-slate-800" title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 underline hover:bg-slate-200 rounded text-slate-800" title="Underline">
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Align Left">
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Align Center">
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Align Right">
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Number Group */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-0.5" title="Currency Format">
            <DollarSign className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-700" title="Percent Format">
            <Percent className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Styles Group (Bad, Good, Neutral matching screenshot!) */}
        <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3 hidden lg:flex">
          <span className="px-2 py-0.5 bg-[#f2f2f2] border border-[#d9d9d9] rounded text-[10px] text-slate-700 font-medium">
            Normal
          </span>
          <span className="px-2 py-0.5 bg-[#ffc7ce] border border-[#ff8a9e] rounded text-[10px] text-[#9c0006] font-bold">
            Bad
          </span>
          <span className="px-2 py-0.5 bg-[#c6efce] border border-[#7ed68d] rounded text-[10px] text-[#006100] font-bold">
            Good
          </span>
          <span className="px-2 py-0.5 bg-[#ffeb9c] border border-[#fcc02e] rounded text-[10px] text-[#9c6500] font-bold">
            Neutral
          </span>
        </div>

        {/* Editing / AutoSum Group */}
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-semibold text-[11px]" title="AutoSum =SUM()">
            <Sigma className="w-3.5 h-3.5 text-emerald-700" />
            AutoSum
          </button>
        </div>
      </div>
    </header>
  );
};
