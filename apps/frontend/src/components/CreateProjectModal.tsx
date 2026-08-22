import React, { useState } from 'react';
import { X, Upload, FolderPlus, Sparkles } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspaceId: string) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'upload'>('create');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return setError('Project name is required');
    
    setIsSubmitting(true);
    setError('');

    try {
      if (activeTab === 'create') {
        const res = await fetch('http://localhost:5001/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, description, language }),
        });
        const data = await res.json();
        if (res.ok) {
          onSuccess(data.id);
        } else {
          setError(data.error || 'Failed to create workspace');
        }
      } else {
        if (!file) {
          setIsSubmitting(false);
          return setError('Please select a ZIP file to import');
        }

        const formData = new FormData();
        formData.append('projectZip', file);
        formData.append('name', projectName);
        formData.append('description', description);

        const res = await fetch('http://localhost:5001/api/workspaces/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          onSuccess(data.id);
        } else {
          setError(data.error || 'Failed to extract project ZIP');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass border border-dark-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Create New Workspace</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-dark-800 bg-dark-900/50">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
              activeTab === 'create'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" /> Blank Project
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Import ZIP Archive
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. My Next.js App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description of the workspace"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {activeTab === 'create' ? (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Primary Template / Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="TypeScript">TypeScript / React</option>
                <option value="JavaScript">Node.js JavaScript</option>
                <option value="Python">Python 3</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Upload ZIP Archive</label>
              <div className="border-2 border-dashed border-dark-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-dark-900/30">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                {file ? (
                  <span className="text-sm font-medium text-indigo-400 truncate block">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                ) : (
                  <span className="text-xs text-neutral-400">Drag & drop your project ZIP file here or click to browse</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? 'Creating...' : activeTab === 'create' ? 'Create Project' : 'Import Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
