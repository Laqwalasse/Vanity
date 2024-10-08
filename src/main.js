const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'electron', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'electron', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('read-settings', () => {
        const settingsPath = path.join(__dirname, '../config/settings.txt');
        return fs.readFileSync(settingsPath, 'utf-8');
    });

    ipcMain.handle('write-settings', (event, data) => {
        const settingsPath = path.join(__dirname, '../config/settings.txt');
        fs.writeFileSync(settingsPath, data, 'utf-8');
    });

    ipcMain.handle('run-script', async (event, script) => {
        const scriptPath = path.join(__dirname, 'modules', script);
        if (script.endsWith('.mjs')) {
            await import(new URL(`file://${scriptPath}`));  // Преобразование в URL.
        } else {
            require('child_process').execSync(`node ${scriptPath}`);
        }
    });

    ipcMain.handle('clear-setting', (event, key) => {
        const settingsPath = path.join(__dirname, '../config/settings.txt');
        let data = fs.readFileSync(settingsPath, 'utf-8');
        const settings = data.split('\n').map(line => {
            const [currentKey, value] = line.split('=');
            if (currentKey === key) {
                return `${key}=`; // Очищаем значение, но оставляем ключ.
            }
            return line;
        });
        fs.writeFileSync(settingsPath, settings.join('\n'), 'utf-8');
    });

    ipcMain.handle('update-setting', (event, key, newValue) => {
        const settingsPath = path.join(__dirname, '../config/settings.txt');
        let data = fs.readFileSync(settingsPath, 'utf-8');
        const settings = data.split('\n').map(line => {
            const [currentKey, value] = line.split('=');
            if (currentKey === key) {
                return `${key}=${newValue}`; // Обновление значения.
            }
            return line;
        });
        fs.writeFileSync(settingsPath, settings.join('\n'), 'utf-8');
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
