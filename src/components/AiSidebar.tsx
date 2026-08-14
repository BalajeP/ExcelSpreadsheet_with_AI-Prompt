import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Zap,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import type { AiChatMessage, SheetData, DashboardWidget } from '../types';
import { AiEngine } from '../services/aiEngine';

interface AiSidebarProps {
  sheetData: SheetData;
  widgets: DashboardWidget[];
  apiKey?: string;
  onWidgetCreated: (widget: DashboardWidget) => void;
  onRowsUpdated: (updatedRows: any[]) => void;
  onHighlightCondition: (condition: any) => void;
  onClose?: () => void;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({
  sheetData,
  apiKey,
  onWidgetCreated,
  onRowsUpdated,
  onHighlightCondition,
  onClose,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello Sankari (Quality Analyst)! Welcome to Quality Dashboard.\n\nHow can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleEditPrompt = (text: string) => {
    setPromptInput(text);
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || promptInput;
    if (!text.trim() || isProcessing) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    if (!textToSend) setPromptInput('');
    setIsProcessing(true);

    try {
      const response = await AiEngine.processPrompt(text, sheetData, apiKey);

      // Handle response actions
      if (response.actionType === 'CREATE_WIDGET' && response.widget) {
        onWidgetCreated(response.widget);
      } else if (response.actionType === 'ADD_ROW' && response.updatedRows) {
        onRowsUpdated(response.updatedRows);
      } else if (response.actionType === 'FORMAT_COLUMN' && response.highlightCondition) {
        onHighlightCondition(response.highlightCondition);
      }

      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken: response.actionType !== 'NONE' ? response.actionType : undefined,
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Sorry, I ran into an error processing your request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl relative">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Quality AI Copilot
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Quality Analyst natural language assistant</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col group ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed relative ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm font-medium'
              }`}
            >
              {msg.text.split('\n').map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {line}
                  {lIdx < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}

              {msg.actionTaken && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Action Executed: {msg.actionTaken}
                </div>
              )}
            </div>

            {/* Message Action Toolbar (Copy & Edit/Re-use) */}
            <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
              <span>{msg.timestamp}</span>

              <button
                onClick={() => handleCopyPrompt(msg.id, msg.text)}
                className="hover:text-indigo-300 transition flex items-center gap-0.5"
                title="Copy text to clipboard"
              >
                {copiedId === msg.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {msg.sender === 'user' && (
                <button
                  onClick={() => handleEditPrompt(msg.text)}
                  className="hover:text-indigo-300 transition flex items-center gap-0.5"
                  title="Edit or re-use prompt"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium p-2 bg-indigo-500/10 rounded-xl w-fit">
            <Zap className="w-4 h-4 animate-bounce" />
            Analyzing prompt & generating dashboard widget...
          </div>
        )}
      </div>

      {/* Prompt Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type prompt e.g. create a circular pie chart..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!promptInput.trim() || isProcessing}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
