const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const isDev = !app.isPackaged;
const indexPath = path.join(__dirname, '../dist/index.html');

// Auto-updater (only in production)
let autoUpdater;
if (!isDev) {
  try { autoUpdater = require('electron-updater').autoUpdater; } catch(e) {}
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: `VnotePad v${app.getVersion()} -- Premium`,
    icon: path.join(__dirname, '../public/icon-512x512.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080/');
  } else {
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load local index.html:', err);
      // Fallback if the path is slightly different in some packaged environments
      const fallbackPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
      mainWindow.loadFile(fallbackPath).catch(err2 => {
        console.error('Failed fallback load:', err2);
      });
    });
  }

  // Security: lock app when minimized
  mainWindow.on('minimize', () => {
    mainWindow.webContents.send('lock-app');
  });
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');

  // ─── Auto-update logic (silent background check) ───
  if (!isDev && autoUpdater) {
    try {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;

      autoUpdater.on('checking-for-update', () => {
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('checking-for-update')
        );
      });

      autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('update-available', info.version)
        );
      });

      autoUpdater.on('update-not-available', () => {
        console.log('Update not available.');
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('update-not-available')
        );
      });

      autoUpdater.on('update-downloaded', () => {
        console.log('Update downloaded and ready to install.');
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('update-downloaded')
        );
      });

      autoUpdater.on('error', (err) => {
        console.error('AutoUpdater error:', err?.message || err);
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('update-error', err?.message)
        );
      });

      // Check for updates 5 seconds after startup (non-blocking)
      setTimeout(() => {
        console.log('Checking for updates...');
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Manual check error:', err?.message);
        });
      }, 5000);
    } catch (err) {
      console.error('Failed to initialize autoUpdater:', err);
    }
  }

  // IPC: renderer can request immediate install
  ipcMain.handle('install-update', () => {
    if (autoUpdater) autoUpdater.quitAndInstall();
  });
  ipcMain.handle('check-update', () => {
    if (autoUpdater) autoUpdater.checkForUpdates();
  });

  ipcMain.handle('export-xlsx', async (event, data, pin) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Salvar Backup de Dados',
        defaultPath: 'vnotepad-backup.xlsx',
        filters: [{ name: 'Planilha Excel', extensions: ['xlsx'] }]
      });

      if (!filePath) return { success: false, error: 'Exportação cancelada pelo usuário.' };

      const XlsxPopulate = require('xlsx-populate');
      const workbook = await XlsxPopulate.fromBlankAsync();
      
      const sheetAnotacoes = workbook.sheet(0);
      sheetAnotacoes.name('Anotações');
      sheetAnotacoes.cell('A1').value('Título').style('bold', true);
      sheetAnotacoes.cell('B1').value('Conteúdo').style('bold', true);
      sheetAnotacoes.cell('C1').value('Categoria').style('bold', true);
      sheetAnotacoes.cell('D1').value('Data Atualização').style('bold', true);

      if (data.notes && data.notes.length > 0) {
        data.notes.forEach((note, index) => {
          const row = index + 2;
          sheetAnotacoes.cell(`A${row}`).value(note.title || 'Sem título');
          sheetAnotacoes.cell(`B${row}`).value(note.content || '');
          sheetAnotacoes.cell(`C${row}`).value(note.category || 'geral');
          sheetAnotacoes.cell(`D${row}`).value(note.updatedAt ? new Date(note.updatedAt).toLocaleString('pt-BR') : '');
        });
      }

      const sheetCalendario = workbook.addSheet('Calendário');
      sheetCalendario.cell('A1').value('Data').style('bold', true);
      sheetCalendario.cell('B1').value('Anotação').style('bold', true);
      sheetCalendario.cell('C1').value('Cor').style('bold', true);

      if (data.calendar && data.calendar.length > 0) {
        data.calendar.forEach((entry, index) => {
          const row = index + 2;
          sheetCalendario.cell(`A${row}`).value(entry.entry_date || '');
          sheetCalendario.cell(`B${row}`).value(entry.content || '');
          // translate colors for better experience
          const colorMap = { "red": "Vermelho", "green": "Verde", "yellow": "Amarelo" };
          sheetCalendario.cell(`C${row}`).value(colorMap[entry.color] || entry.color || 'Padrão');
        });
      }

      await workbook.toFileAsync(filePath, { password: pin });
      return { success: true, filePath };
    } catch (error) {
      console.error("Export error:", error);
      return { success: false, error: error.message || 'Erro desconhecido.' };
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
