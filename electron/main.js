const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "VnotePad",
    icon: path.join(__dirname, '../public/icon-512x512.png'),
    autoHideMenuBar: true, /* Esconder menu padrão superior */
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    // Modo de Desenvolvimento
    mainWindow.loadURL('http://localhost:8080/');
  } else {
    // Modo de Produção (Executável Embutido)
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
