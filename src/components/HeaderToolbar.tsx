import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  LayoutDashboard, 
  Download, 
  FileUp, 
  FileText, 
  Settings as SettingsIcon, 
  DownloadCloud, 
  Sparkles,
  RefreshCw
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
      alert('App icon installation is available when accessed via a PWA-supported browser (Chrome/Edge). You can also use "Install App" from browser menu.');
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
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      {/* App Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
            SheetAI Copilot
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
              PWA
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            Smart Excel Spreadsheet & AI Dashboard Generator
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sheet'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Spreadsheet
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Import File */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer">
          <FileUp className="w-3.5 h-3.5 text-indigo-400" />
          Import (.xlsx / .csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Export Excel */}
        <button
          onClick={() => ExportService.exportToExcel(sheetData)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
          title="Export data to Microsoft Excel .xlsx"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          Export Excel
        </button>

        {/* Export PDF Dashboard */}
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/30 transition"
          title="Export dashboard charts to PDF"
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          Export PDF
        </button>

        {/* PWA Install Button */}
        {!isAppInstalled && (
          <button
            onClick={handleInstallPwa}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-pink-500/20 transition"
            title="Install App Icon on Desktop / Mobile"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            Install App Icon
          </button>
        )}

        {/* Reset Sample Data */}
        <button
          onClick={onResetData}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          title="Reset to Sample Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          title="AI & App Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
