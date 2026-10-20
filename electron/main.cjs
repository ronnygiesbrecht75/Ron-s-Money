const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 420,
    minHeight: 640,
    title: "Ron's Money - Gestión de Dinero",
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
    },
  });

  // Load the built Vite SPA
  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  // Open external links in user's default browser (e.g. Google Cloud links)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to download and launch Windows installer directly without opening folder
ipcMain.handle('install-update-exe', async (event, { url, base64, fileName }) => {
  try {
    const targetFileName = fileName || 'Rons-Money-Setup.exe';
    const tempDir = os.tmpdir();
    const destPath = path.join(tempDir, targetFileName);

    if (base64) {
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      fs.writeFileSync(destPath, Buffer.from(cleanBase64, 'base64'));
      await shell.openPath(destPath);
      return { success: true };
    }

    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const fileStream = fs.createWriteStream(destPath);
      await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            // handle redirect
            client.get(response.headers.location, (redirectRes) => {
              redirectRes.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                resolve(true);
              });
            }).on('error', reject);
          } else {
            response.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve(true);
            });
          }
        });
        request.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });

      await shell.openPath(destPath);
      return { success: true };
    }

    if (fs.existsSync(destPath)) {
      await shell.openPath(destPath);
      return { success: true };
    }

    return { success: false, error: 'No se pudo ubicar el instalador' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

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
