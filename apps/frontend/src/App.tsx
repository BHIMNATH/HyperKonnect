import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Terminal, Code, Users, Cpu, ArrowRight, Plus, FolderGit2 } from 'lucide-react';
import { CreateProjectModal } from './components/CreateProjectModal';
import { WorkspaceEditor } from './components/WorkspaceEditor';

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />

      {/* Navigation */}
      <nav className="glass border-b border-dark-800/80 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <span className="font-semibold text-lg tracking-wider text-white">Hyper<span className="text-indigo-400">Konnect</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Sign In</Link>
          <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/20 hover:scale-105">
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-xs text-indigo-300 font-medium mb-6 animate-pulse">
          <Cpu className="w-3.5 h-3.5" /> Collaborative AI Developer Workspace
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl leading-tight">
          Collaborate in Real-Time with <span className="text-gradient">AI Superpowers</span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Upload projects, code collaboratively in real-time with Monaco Editor, run JavaScript & Python scripts in seconds, and chat with an intelligent AI code assistant.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 group">
            Start Coding Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="glass hover:bg-dark-800 text-neutral-300 px-8 py-4 rounded-xl font-medium transition-all">
            Explore Features
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass glass-hover p-6 rounded-2xl">
            <Code className="w-10 h-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Monaco Code Editor</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              VS Code-like editing experience with full tab management, syntax highlighting, and auto-save.
            </p>
          </div>
          <div className="glass glass-hover p-6 rounded-2xl">
            <Users className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Collaboration</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Synchronize file editing instantly using Yjs and Socket.IO. Live room presence and collaborator chat.
            </p>
          </div>
          <div className="glass glass-hover p-6 rounded-2xl">
            <Cpu className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sandboxed Execution & AI</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Execute Python/JS inside secure child processes. Ask AI to explain code, fix bugs, or write tests.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-dark-800/80 px-6 py-6 text-center text-sm text-neutral-500 mt-20">
        &copy; {new Date().getFullYear()} HyperKonnect. Collaborative AI Developer Workspace.
      </footer>
    </div>
  );
}

// Stub Auth
function AuthView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
      <div className="glass p-8 rounded-2xl max-w-md w-full border border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-neutral-400 text-sm mb-6">Sign in to access your collaborative workspaces.</p>
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Sign In with Demo Account
          </button>
          <Link to="/" className="block text-center text-sm text-neutral-400 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Interactive Dashboard Component
function DashboardView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreated = (id: string) => {
    setIsModalOpen(false);
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navbar */}
        <nav className="flex items-center justify-between mb-10 pb-6 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-xl text-white">Hyper<span className="text-indigo-400">Konnect</span></span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </nav>

        <h1 className="text-3xl font-bold text-white mb-2">Your Workspaces</h1>
        <p className="text-neutral-400 text-sm mb-8">Select an existing workspace or upload a project ZIP file to start coding.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create New Project Card */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="glass p-6 rounded-2xl flex flex-col justify-between h-48 border-dashed border-dark-700 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">Create or Import Project</h3>
              <p className="text-neutral-400 text-xs mt-1">Upload a ZIP file or create a blank React/TypeScript project.</p>
            </div>
            <span className="text-indigo-400 font-medium text-sm flex items-center gap-1">
              Start Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* List Workspaces */}
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              className="glass p-6 rounded-2xl flex flex-col justify-between h-48 border border-dark-800 hover:border-dark-600 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <FolderGit2 className="w-6 h-6 text-indigo-400" />
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {ws.language || 'Code'}
                  </span>
                </div>
                <h3 className="font-semibold text-white truncate">{ws.name}</h3>
                <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{ws.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-dark-800">
                <span>{ws.filesCount || 4} Files</span>
                <span className="text-indigo-400 font-medium hover:underline flex items-center gap-1">
                  Open IDE <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}

// Workspace Editor Route Wrapper
function WorkspaceViewRoute() {
  const { id } = useParams<{ id: string }>();
  return <WorkspaceEditor workspaceId={id || 'demo-project'} />;
}

// Router Setup
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthView />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/workspace/:id" element={<WorkspaceViewRoute />} />
      </Routes>
    </Router>
  );
}
