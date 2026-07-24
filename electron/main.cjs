const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || app.commandLine?.hasSwitch('dev');

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
      nodeIntegration: false
    }
  });

  const indexHtml = path.join(__dirname, '..', 'index.html');
  win.loadFile(indexHtml);

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
