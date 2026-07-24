const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let aiProcess = null;
let aiReady = false;

function ensureAiBackend() {
  if (aiReady && aiProcess) return;

  const python = `python`;
  const script = path.join(__dirname, '..', 'ai-backend', 'app.py');

  aiProcess = spawn(python, [script], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  aiProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Uvicorn running on')) {
      aiReady = true;
    }
  });

  aiProcess.stderr.on('data', () => {
    // keep startup noisy output internal
  });

  aiProcess.on('error', (err) => {
    aiReady = false;
  });
}

function stopAiBackend() {
  if (aiProcess) {
    try {
      aiProcess.kill();
    } catch (_e) {}
    aiProcess = null;
    aiReady = false;
  }
}

async function waitForAi(maxMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (aiReady) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return aiReady;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'PhysicaX',
    backgroundColor: '#f6f2ea',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(async () => {
  try {
    ensureAiBackend();
  } catch (_e) {
    aiReady = false;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAiBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('ai:chat', async (_event, message, history) => {
  const payload = { message, history: history || [] };

  if (!aiReady) {
    await waitForAi(2000);
  }

  if (aiReady) {
    try {
      const resp = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const data = await resp.json();
        return data.response || '[Empty backend response]';
      }

      return `[AI backend error] Status ${resp.status}`;
    } catch (_e) {
      return '[AI backend unavailable]';
    }
  }

  return '[AI offline] Backend did not start. Make sure Python is installed.';
});
