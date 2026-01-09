const { app, BrowserWindow, session, net, ipcMain } = require('electron');
const path = require('path');

// Enable HTTP/3 (QUIC) support with comprehensive flags
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('quic-version', 'h3');
app.commandLine.appendSwitch('enable-features', 'EnableTLS13EarlyData,UseNewQUICClient');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

// Handle requests from renderer using Electron's net module
ipcMain.handle('fetch-url', async (event, url) => {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let responseData = '';
    let responseHeaders = {};
    let statusCode = 0;
    let httpVersion = '';
    
    request.on('response', (response) => {
      statusCode = response.statusCode;
      responseHeaders = response.headers;
      httpVersion = response.httpVersion || 'unknown';
      
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      
      response.on('end', () => {
        resolve({
          statusCode,
          headers: responseHeaders,
          body: responseData,
          httpVersion
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error.message);
    });
    
    request.end();
  });
});

// Open net-internals in a new window
ipcMain.handle('open-net-internals', async () => {
  const netWindow = new BrowserWindow({
    width: 1000,
    height: 700
  });
  netWindow.loadURL('chrome://net-internals/#quic');
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
