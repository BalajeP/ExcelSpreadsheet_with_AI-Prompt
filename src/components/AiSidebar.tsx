import React, { useState, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Zap,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  Plus
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [promptInput, setPromptInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline editing state for prompts
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');

  const [chatHistory, setChatHistory] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello Sankari (Quality Analyst)! Welcome to Quality Dashboard.\n\nHow can I help you today? You can type prompts or add files (+)!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartEditPrompt = (msg: AiChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingMsgText(msg.text);
    setPromptInput(msg.text);
    if (msg.imageUrl) setSelectedImage(msg.imageUrl);
  };

  const handleSaveInlineEdit = async (msgId: string) => {
    if (!editingMsgText.trim() || isProcessing) return;

    setChatHistory((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text: editingMsgText.trim() } : m))
    );

    const updatedText = editingMsgText.trim();
    setEditingMsgId(null);
    setIsProcessing(true);

    try {
      const response = await AiEngine.processPrompt(updatedText, sheetData, apiKey, selectedImage || undefined);

      if (response.actionType === 'CREATE_WIDGET' && response.widget) {
        onWidgetCreated(response.widget);
      } else if (response.actionType === 'ADD_ROW' && response.updatedRows) {
        onRowsUpdated(response.updatedRows);
      } else if (response.actionType === 'FORMAT_COLUMN' && response.highlightCondition) {
        onHighlightCondition(response.highlightCondition);
      }

      const aiMsg: AiChatMessage = {
        id: `ai-re-${Date.now()}`,
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
          text: 'Sorry, I ran into an error re-running your updated prompt.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setSelectedImage(null);
    }
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || promptInput;
    if ((!text.trim() && !selectedImage) || isProcessing) return;

    const currentImage = selectedImage;
    const finalPromptText = text.trim() || (currentImage ? 'Analyze attached file and generate dashboard widget' : '');

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: finalPromptText,
      imageUrl: currentImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    if (!textToSend) setPromptInput('');
    setSelectedImage(null);
    setIsProcessing(true);

    try {
      const response = await AiEngine.processPrompt(finalPromptText, sheetData, apiKey, currentImage || undefined);

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
    <aside className="w-80 sm:w-96 lg:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl relative select-text">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5 select-text">
              Quality AI Copilot
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[11px] text-slate-400 select-text">Natural language & file assistant</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin select-text">
        {chatHistory.map((msg) => {
          const isInlineEditing = editingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed relative select-text cursor-text ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm font-medium'
                }`}
              >
                {/* Attached File/Image Display in Chat */}
                {msg.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-indigo-400/40 shadow-sm max-w-xs">
                    <img
                      src={msg.imageUrl}
                      alt="Attached File"
                      className="max-h-40 w-full object-cover rounded-xl hover:scale-105 transition"
                    />
                  </div>
                )}

                {isInlineEditing ? (
                  <div className="flex flex-col gap-2 w-full min-w-[240px]">
                    <textarea
                      value={editingMsgText}
                      onChange={(e) => setEditingMsgText(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 text-white border border-indigo-400 rounded-xl p-2.5 text-xs outline-none shadow-inner resize-y select-text"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingMsgId(null)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveInlineEdit(msg.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg shadow transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Save & Re-run
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.text.split('\n').map((line, lIdx) => (
                      <React.Fragment key={lIdx}>
                        <span className="select-text">{line}</span>
                        {lIdx < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}

                    {msg.actionTaken && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold select-text">
                        <CheckCircle2 className="w-3 h-3" />
                        Action Executed: {msg.actionTaken}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Message Action Toolbar (Copy & Edit/Re-use) */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500 select-none">
                <span>{msg.timestamp}</span>

                <button
                  onClick={() => handleCopyPrompt(msg.id, msg.text)}
                  className="hover:text-indigo-300 transition flex items-center gap-0.5 cursor-pointer"
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

                {msg.sender === 'user' && !isInlineEditing && (
                  <button
                    onClick={() => handleStartEditPrompt(msg)}
                    className="hover:text-indigo-300 transition flex items-center gap-0.5 cursor-pointer"
                    title="Edit and re-run prompt"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit & Re-run</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium p-2.5 bg-indigo-500/10 rounded-xl w-fit">
            <Zap className="w-4 h-4 animate-bounce" />
            Analyzing prompt & attached file...
          </div>
        )}
      </div>

      {/* Prompt Input Form & Add File (+) Controls */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/95 select-text">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex flex-col gap-2"
        >
          {/* Small File Thumbnail Preview if attached */}
          {selectedImage && (
            <div className="flex items-center gap-2 mb-1">
              <div className="relative w-11 h-11 rounded-lg border border-emerald-500/80 overflow-hidden shadow-xs shrink-0 group">
                <img src={selectedImage} alt="Attached File" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-0.5 right-0.5 bg-slate-950/90 text-white rounded-full p-0.5 hover:bg-rose-600 transition cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">1 File Attached</span>
            </div>
          )}

          <div className="relative flex items-center">
            {/* (+) Add File Icon Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2.5 top-3 p-1.5 bg-slate-800 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-emerald-400 rounded-lg transition cursor-pointer shadow-xs active:scale-95"
              title="Add File / Screenshot (+)"
            >
              <Plus className="w-4 h-4" />
            </button>

            <textarea
              placeholder="Type your AI prompt..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              rows={3}
              disabled={isProcessing}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-2xl pl-12 pr-12 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner select-text resize-none"
            />

            <button
              type="submit"
              disabled={(!promptInput.trim() && !selectedImage) || isProcessing}
              className="absolute right-2.5 bottom-2.5 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-xl shadow-md transition cursor-pointer"
              title="Send prompt (Press Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
            <span>Press Enter to send</span>
            <span>Shift + Enter for new line</span>
          </div>
        </form>
      </div>
    </aside>
  );
};
