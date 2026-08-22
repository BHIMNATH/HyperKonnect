import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FileCode, Folder, Play, Bot, MessageSquare, Terminal as TerminalIcon, 
  Save, RefreshCw, Send, CheckCircle2, FilePlus, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

interface WorkspaceEditorProps {
  workspaceId: string;
}

export function WorkspaceEditor({ workspaceId }: WorkspaceEditorProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string>('index.ts');
  const [fileContent, setFileContent] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>(['index.ts']);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{ stdout: string; stderr: string; durationMs?: number } | null>(null);
  const [showConsole, setShowConsole] = useState(true);

  // AI & Chat Panel
  const [activeRightTab, setActiveRightTab] = useState<'ai' | 'chat'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI project assistant. Ask me to explain code, fix bugs, or suggest refactorings.' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Workspace Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Connected to collaborative workspace room.', time: 'Just now' }
  ]);

  // Load File Tree
  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/workspaces/${workspaceId}/files`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data);
        }
      } catch (err) {
        console.error('Failed to load file tree:', err);
      }
    };
    fetchFileTree();
  }, [workspaceId]);

  // Load Active File Content
  useEffect(() => {
    if (!activeFile) return;

    const fetchFileContent = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(activeFile)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content || '');
        }
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    };
    fetchFileContent();
  }, [workspaceId, activeFile]);

  // Save File
  const handleSave = async (contentToSave = fileContent) => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:5001/api/workspaces/${workspaceId}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile, content: contentToSave }),
      });
      if (res.ok) {
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Code
  const handleExecute = async () => {
    setIsExecuting(true);
    setShowConsole(true);
    try {
      const lang = activeFile.endsWith('.py') ? 'python' : 'javascript';
      const res = await fetch('http://localhost:5001/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: fileContent }),
      });
      const data = await res.json();
      setExecutionOutput(data);
    } catch (err: any) {
      setExecutionOutput({ stdout: '', stderr: err.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  // AI Assistant Request
  const handleAiAction = async (action = 'chat', customPrompt = '') => {
    const promptText = customPrompt || aiPrompt;
    if (!promptText && action === 'chat') return;

    if (promptText) {
      setAiMessages(prev => [...prev, { sender: 'user', text: promptText }]);
    }
    setIsAiLoading(true);
    setAiPrompt('');

    try {
      const res = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          codeContext: fileContent,
          filename: activeFile,
          action,
        }),
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err: any) {
      setAiMessages(prev => [...prev, { sender: 'ai', text: 'Failed to contact AI service.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Chat Send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  const selectFile = (filePath: string) => {
    setActiveFile(filePath);
    if (!openTabs.includes(filePath)) {
      setOpenTabs([...openTabs, filePath]);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-dark-950 text-white overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 glass border-b border-dark-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 hover:bg-dark-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm tracking-wide">{workspaceId}</span>
            <span className="px-2 py-0.5 text-[10px] bg-green-500/10 border border-green-500/30 text-green-400 rounded-full font-mono">
              Live Presence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="glass hover:bg-dark-800 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" /> Save
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {isExecuting ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Explorer Sidebar */}
        <aside className="w-64 glass border-r border-dark-800 flex flex-col">
          <div className="p-3 border-b border-dark-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Explorer</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-dark-800 rounded text-neutral-400 hover:text-white">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {files.map((file) => (
              <div
                key={file.path}
                onClick={() => file.type === 'file' && selectFile(file.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeFile === file.path
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                    : 'text-neutral-400 hover:bg-dark-800 hover:text-neutral-200'
                }`}
              >
                {file.type === 'directory' ? (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Editor & Terminal Console Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-dark-950 relative">
          {/* File Tabs */}
          <div className="flex items-center bg-dark-900 border-b border-dark-800 px-2 overflow-x-auto">
            {openTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFile(tab)}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b-2 transition-all ${
                  activeFile === tab
                    ? 'border-indigo-500 text-white bg-dark-950'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>{tab}</span>
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={activeFile.endsWith('.py') ? 'python' : 'typescript'}
              theme="vs-dark"
              value={fileContent}
              onChange={(val) => setFileContent(val || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Bottom Terminal Console */}
          {showConsole && (
            <div className="h-44 border-t border-dark-800 bg-dark-950 flex flex-col font-mono text-xs">
              <div className="px-4 py-2 bg-dark-900 border-b border-dark-800 flex items-center justify-between text-neutral-400">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-indigo-400" />
                  <span>Execution Output Terminal</span>
                </div>
                {executionOutput?.durationMs && (
                  <span className="text-[10px] text-neutral-500">Took {executionOutput.durationMs}ms</span>
                )}
              </div>
              <div className="flex-1 p-3 overflow-y-auto text-neutral-300">
                {isExecuting ? (
                  <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing script in sandbox...
                  </div>
                ) : executionOutput ? (
                  <div>
                    {executionOutput.stdout && (
                      <pre className="text-emerald-400 whitespace-pre-wrap">{executionOutput.stdout}</pre>
                    )}
                    {executionOutput.stderr && (
                      <pre className="text-red-400 whitespace-pre-wrap">{executionOutput.stderr}</pre>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-600">Click "Run Code" above to execute JavaScript or Python in isolated sandbox.</span>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: AI Assistant & Workspace Chat */}
        <aside className="w-80 glass border-l border-dark-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-dark-800 bg-dark-900/50">
            <button
              onClick={() => setActiveRightTab('ai')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeRightTab === 'ai'
                  ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              <Bot className="w-4 h-4" /> AI Assistant
            </button>
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeRightTab === 'chat'
                  ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Workspace Chat
            </button>
          </div>

          {/* AI Tab Content */}
          {activeRightTab === 'ai' && (
            <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
              {/* Quick AI Action Chips */}
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                <button
                  onClick={() => handleAiAction('explain', 'Explain this code')}
                  className="px-2.5 py-1 text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/20 transition-all shrink-0"
                >
                  💡 Explain Code
                </button>
                <button
                  onClick={() => handleAiAction('fix', 'Find bugs and fix them')}
                  className="px-2.5 py-1 text-[11px] bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/20 transition-all shrink-0"
                >
                  🐛 Fix Bugs
                </button>
                <button
                  onClick={() => handleAiAction('refactor', 'Suggest refactorings')}
                  className="px-2.5 py-1 text-[11px] bg-pink-500/10 border border-pink-500/20 text-pink-300 rounded-lg hover:bg-pink-500/20 transition-all shrink-0"
                >
                  ⚡ Refactor
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {aiMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/30 text-indigo-100 ml-4 border border-indigo-500/30'
                        : 'bg-dark-900 border border-dark-700 text-neutral-300 mr-2'
                    }`}
                  >
                    <div className="font-semibold text-[10px] text-neutral-400 mb-1">
                      {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="p-3 rounded-xl bg-dark-900 text-xs text-indigo-400 animate-pulse">
                    AI is analyzing codebase context...
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="pt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask AI about this file..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAction()}
                    className="w-full pl-3 pr-9 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAiAction()}
                    className="absolute right-2 top-2 text-indigo-400 hover:text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Chat Tab */}
          {activeRightTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                      <span className="font-medium text-indigo-400">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-neutral-300">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="pt-2 relative">
                <input
                  type="text"
                  placeholder="Message collaborators..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="absolute right-2 top-4 text-indigo-400 hover:text-white">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
