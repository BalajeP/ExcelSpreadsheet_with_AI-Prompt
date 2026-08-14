import React, { useState } from 'react';
import { X, Key, Save, RotateCcw, Check } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({ ...settings, geminiApiKey: apiKey });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            AI & App Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <label className="font-semibold text-slate-200 block mb-1.5">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If left blank, the app uses its built-in intelligent NLP engine to execute prompt commands offline!
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <div className="font-semibold text-indigo-300">Data Privacy & Local Storage</div>
            <p className="text-slate-400 leading-relaxed">
              Your spreadsheet data is stored 100% locally in your browser (IndexedDB / LocalStorage). No spreadsheet rows are sent to external servers unless you enter a custom Gemini API key.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all sheet data and widgets to sample defaults?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl border border-rose-500/20 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              Reset Spreadsheet & Dashboard to Defaults
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
