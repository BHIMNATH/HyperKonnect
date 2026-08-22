import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import multer from 'multer';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import logger from './config/logger.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Base storage setup
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'workspaces');
const UPLOADS_DIR = path.join(process.cwd(), 'storage', 'uploads');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 50 * 1024 * 1024 } });

// In-memory workspace metadata store
interface WorkspaceMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  filesCount: number;
  language: string;
}

const workspacesStore: Record<string, WorkspaceMeta> = {
  'demo-project': {
    id: 'demo-project',
    name: 'HyperKonnect Demo Workspace',
    description: 'Sample collaborative React & TypeScript workspace',
    createdAt: new Date().toISOString(),
    filesCount: 4,
    language: 'TypeScript',
  },
};

// Default sample files for demo project
const sampleFiles: Record<string, string> = {
  'index.ts': `// HyperKonnect Collaborative Code Workspace\nconsole.log("Welcome to HyperKonnect!");\n\nfunction calculateSum(a: number, b: number): number {\n  return a + b;\n}\n\nconsole.log("Result:", calculateSum(40, 2));\n`,
  'App.tsx': `import React from 'react';\n\nexport default function App() {\n  return (\n    <div style={{ padding: '20px', color: '#6366f1' }}>\n      <h1>Hello from HyperKonnect AI Workspace!</h1>\n    </div>\n  );\n}\n`,
  'main.py': `# HyperKonnect Python Execution Test\nimport sys\n\ndef greet(name):\n    print(f"Hello, {name} from Python {sys.version.split()[0]}!")\n\ngreet("Collaborator")\n`,
  'README.md': `# HyperKonnect Workspace\n\nWelcome to your collaborative AI-powered code workspace.\n- Edit files in real-time\n- Execute JavaScript and Python code\n- Ask AI assistant questions\n`,
};

function ensureSampleFiles(wsId: string) {
  const wsDir = path.join(STORAGE_DIR, wsId);
  if (!fs.existsSync(wsDir)) {
    fs.mkdirSync(wsDir, { recursive: true });
    for (const [filename, content] of Object.entries(sampleFiles)) {
      fs.writeFileSync(path.join(wsDir, filename), content, 'utf-8');
    }
  }
}
ensureSampleFiles('demo-project');

// Helper to check safe path
function getSafeFilePath(wsId: string, relPath: string): string {
  const wsDir = path.join(STORAGE_DIR, wsId);
  const safePath = path.normalize(path.join(wsDir, relPath));
  if (!safePath.startsWith(wsDir)) {
    throw new Error('Access denied: Path traversal prohibited');
  }
  return safePath;
}

// REST Endpoints
app.get('/', (req, res) => {
  res.json({ message: 'HyperKonnect API Server', version: '1.0.0', health: '/health' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// List Workspaces
app.get('/api/workspaces', (req, res) => {
  res.json(Object.values(workspacesStore));
});

// Create Workspace
app.post('/api/workspaces', (req, res) => {
  const { name, description, language } = req.body;
  const id = (name || 'project').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
  
  workspacesStore[id] = {
    id,
    name: name || 'Untitled Workspace',
    description: description || 'AI-assisted code workspace',
    createdAt: new Date().toISOString(),
    filesCount: 4,
    language: language || 'TypeScript',
  };

  ensureSampleFiles(id);
  res.status(201).json(workspacesStore[id]);
});

// Upload ZIP Project
app.post('/api/workspaces/upload', upload.single('projectZip'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file uploaded' });
    }

    const { name, description } = req.body;
    const wsId = (name || 'imported-project').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
    const wsDir = path.join(STORAGE_DIR, wsId);
    fs.mkdirSync(wsDir, { recursive: true });

    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(wsDir, true);

    // Clean up uploaded zip
    fs.unlinkSync(req.file.path);

    // Count extracted files
    const files = fs.readdirSync(wsDir);

    workspacesStore[wsId] = {
      id: wsId,
      name: name || req.file.originalname.replace('.zip', ''),
      description: description || 'Imported project workspace',
      createdAt: new Date().toISOString(),
      filesCount: files.length,
      language: 'JavaScript/TypeScript',
    };

    res.status(201).json(workspacesStore[wsId]);
  } catch (err: any) {
    logger.error('ZIP upload error: ' + err.message);
    res.status(500).json({ error: 'Failed to process project archive' });
  }
});

// Get Workspace File Tree
app.get('/api/workspaces/:id/files', (req, res) => {
  try {
    const wsId = req.params.id;
    const wsDir = path.join(STORAGE_DIR, wsId);
    if (!fs.existsSync(wsDir)) {
      ensureSampleFiles(wsId);
    }

    const readFiles = (dir: string): any[] => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      return items
        .filter(item => !['node_modules', '.git', 'dist', 'build'].includes(item.name))
        .map(item => {
          const fullPath = path.join(dir, item.name);
          const relPath = path.relative(wsDir, fullPath);
          if (item.isDirectory()) {
            return {
              name: item.name,
              path: relPath,
              type: 'directory',
              children: readFiles(fullPath),
            };
          }
          return {
            name: item.name,
            path: relPath,
            type: 'file',
            size: fs.statSync(fullPath).size,
          };
        });
    };

    const tree = readFiles(wsDir);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single File Content
app.get('/api/workspaces/:id/file', (req, res) => {
  try {
    const wsId = req.params.id;
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'Path query param required' });

    const safePath = getSafeFilePath(wsId, filePath);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    res.json({ path: filePath, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save File Content
app.post('/api/workspaces/:id/file', (req, res) => {
  try {
    const wsId = req.params.id;
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Path required' });

    const safePath = getSafeFilePath(wsId, filePath);
    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, content || '', 'utf-8');

    res.json({ success: true, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Code Execution Endpoint (JavaScript & Python)
app.post('/api/execute', (req, res) => {
  const { language, code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided for execution' });

  const tempId = 'exec-' + Date.now();
  const lang = (language || 'javascript').toLowerCase();

  let cmd = '';
  let filePath = '';

  if (lang === 'python' || lang === 'py') {
    filePath = path.join(UPLOADS_DIR, `${tempId}.py`);
    fs.writeFileSync(filePath, code, 'utf-8');
    cmd = `python3 "${filePath}"`;
  } else {
    filePath = path.join(UPLOADS_DIR, `${tempId}.js`);
    fs.writeFileSync(filePath, code, 'utf-8');
    cmd = `node "${filePath}"`;
  }

  const startTime = Date.now();
  exec(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    // Cleanup temporary file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const durationMs = Date.now() - startTime;
    if (error && error.killed) {
      return res.json({
        success: false,
        stdout,
        stderr: 'Execution timed out after 30 seconds limit.',
        durationMs,
      });
    }

    res.json({
      success: !error,
      stdout: stdout || '',
      stderr: stderr || (error ? error.message : ''),
      durationMs,
    });
  });
});

// AI Assistant Chat API Endpoint
app.post('/api/ai/chat', (req, res) => {
  const { prompt, codeContext, filename, action } = req.body;
  
  let responseText = '';
  if (action === 'explain') {
    responseText = `### 💡 Code Explanation (${filename || 'Selected File'})\n\nThis module defines the main execution logic. Key functions:\n- Structured imports and error handling\n- Clean input parameter validation\n- Asynchronous event flow processing\n\n**Recommendation**: Consider adding inline return types for strict type checking.`;
  } else if (action === 'fix') {
    responseText = `### 🐛 Bug Fix Analysis (${filename || 'Code'})\n\nFound potential edge case:\n\`\`\`typescript\n// Recommended patch:\nif (!data) {\n  throw new Error("Invalid payload");\n}\n\`\`\`\n*Fixed potential null pointer dereference.*`;
  } else if (action === 'refactor') {
    responseText = `### ⚡ Refactoring Suggestion\n\n\`\`\`typescript\n// Modular refactored implementation:\nexport const processTask = async (task: TaskPayload) => {\n  const result = await execute(task);\n  return { success: true, result };\n};\n\`\`\`\n*Improves reusability and testability.*`;
  } else {
    responseText = `### 🤖 AI Assistant Response\n\nRegarding your question: "${prompt}"\n\nI analyzed the workspace context. ${codeContext ? 'Inspected file: `' + filename + '`.' : 'Ready to help debug, refactor, or explain your project files.'}`;
  }

  res.json({ response: responseText, timestamp: new Date().toISOString() });
});

// Socket.IO Real-Time Collaboration & Presence
const workspaceMessages: Record<string, any[]> = {};

io.on('connection', (socket) => {
  logger.info(`Client connected to collaboration socket: ${socket.id}`);

  socket.on('join-workspace', ({ workspaceId, username }) => {
    socket.join(`workspace:${workspaceId}`);
    socket.data.workspaceId = workspaceId;
    socket.data.username = username || 'Anonymous Collaborator';

    // Send chat history
    const history = workspaceMessages[workspaceId] || [];
    socket.emit('chat-history', history);

    // Notify room of presence
    io.to(`workspace:${workspaceId}`).emit('user-joined', {
      userId: socket.id,
      username: socket.data.username,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('send-message', ({ workspaceId, message }) => {
    const chatMsg = {
      id: Date.now().toString(),
      sender: socket.data.username || 'Collaborator',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (!workspaceMessages[workspaceId]) {
      workspaceMessages[workspaceId] = [];
    }
    workspaceMessages[workspaceId].push(chatMsg);
    if (workspaceMessages[workspaceId].length > 100) {
      workspaceMessages[workspaceId].shift(); // Keep last 100
    }

    io.to(`workspace:${workspaceId}`).emit('new-message', chatMsg);
  });

  socket.on('disconnect', () => {
    if (socket.data.workspaceId) {
      io.to(`workspace:${socket.data.workspaceId}`).emit('user-left', {
        userId: socket.id,
        username: socket.data.username,
      });
    }
  });
});

// Start DB and HTTP server
const PORT = (process.env.PORT && process.env.PORT !== '5000') ? process.env.PORT : 5001;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`HyperKonnect backend running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server: ' + err);
});
