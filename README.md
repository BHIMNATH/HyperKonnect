# HyperKonnect

### AI-Powered Collaborative Developer Workspace

HyperKonnect is an AI-powered collaborative developer workspace that brings real-time code collaboration, project-aware AI assistance, code execution, and project management into a single platform.

Designed as a lightweight combination of **VS Code, Cursor, GitHub, Notion, and Replit**, HyperKonnect enables developers to upload existing projects, explore and edit code together in real time, ask AI questions about their codebase, execute JavaScript and Python code in isolated environments, and download their updated projects.

## ✨ Features

* 🔐 **Authentication** — JWT-based user authentication and workspace access control
* 📁 **Project Import** — Upload and extract existing projects from ZIP files
* 🗂️ **File Explorer** — Create, rename, delete, search, upload, and download files
* 💻 **Monaco Editor** — VS Code-like code editing with tabs, themes, syntax highlighting, and auto-save
* 👥 **Real-Time Collaboration** — Collaborate on individual files using Socket.IO and Yjs
* 🟢 **Live Presence** — See active collaborators, cursors, and selections in real time
* 💬 **Workspace Chat** — Communicate with collaborators inside the workspace
* 🤖 **AI Code Assistant** — Explain, debug, refactor, test, and document code using project-aware AI context
* 🧠 **Project Intelligence** — Retrieve relevant code context instead of sending the entire project to the AI
* ▶️ **Code Execution** — Execute JavaScript and Python in isolated environments with resource limits
* 📦 **Project Export** — Download updated projects as ZIP archives
* 🛡️ **Security** — Path traversal protection, upload validation, workspace isolation, rate limiting, and sandboxed execution

## 🏗️ Architecture

HyperKonnect uses a modular monorepo architecture designed for reliability, maintainability, and future expansion.

* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Monaco Editor, Zustand
* **Backend:** Node.js, Express, Socket.IO, Yjs, Multer, JWT
* **Database:** MongoDB for users, projects, permissions, and workspace metadata
* **Storage:** Local filesystem for project files and workspace data
* **AI:** OpenAI-compatible API with project-aware context retrieval
* **Execution:** Docker-based isolated execution with worker fallback

Project files are stored on the filesystem rather than inside MongoDB. Real-time collaboration is handled at the **file level using Yjs**, ensuring that only actively opened files are synchronized.

## 🎯 Project Goals

HyperKonnect was built to explore the engineering challenges involved in creating a collaborative developer environment, including:

* Real-time collaborative editing
* Workspace-level isolation
* AI-assisted code understanding
* Secure project imports
* Sandboxed code execution
* Efficient project context retrieval
* Scalable application architecture

The MVP is designed for small collaborative teams and portfolio demonstration, with an architecture that can be extended for larger deployments in the future.

## 🛠️ Tech Stack

| Category           | Technologies                          |
| ------------------ | ------------------------------------- |
| Frontend           | React, Vite, TypeScript, Tailwind CSS |
| Code Editor        | Monaco Editor                         |
| State Management   | Zustand                               |
| Collaboration      | Socket.IO, Yjs                        |
| Backend            | Node.js, Express                      |
| Authentication     | JWT                                   |
| Database           | MongoDB                               |
| File Storage       | Local Filesystem                      |
| AI                 | OpenAI-Compatible API                 |
| Code Execution     | Docker                                |
| Validation         | Zod                                   |
| Logging            | Pino                                  |
| Package Management | pnpm                                  |

## 🚀 Roadmap

* [x] Authentication
* [x] Workspace management
* [x] Project ZIP import
* [x] File explorer
* [x] Monaco code editor
* [x] Real-time collaboration
* [x] Workspace chat
* [x] AI code assistant
* [x] Code execution
* [x] Project download
* [ ] Git integration
* [ ] Branch management
* [ ] Pull request workflow
* [ ] AI-powered codebase indexing
* [ ] Advanced semantic search
* [ ] Cloud deployment
* [ ] Multi-user production scaling

## 📌 Status

**HyperKonnect is an MVP / portfolio project under active development.**

The current architecture is optimized for reliability and simplicity for small collaborative teams rather than enterprise-scale infrastructure.

---

Built with TypeScript, React, Node.js, Yjs, and AI.
