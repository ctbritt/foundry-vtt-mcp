import { app, BrowserWindow, Menu, shell, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import notifier from 'node-notifier';

class FoundryMCPServerApp {
  private mainWindow: BrowserWindow | null = null;
  private mcpServerProcess: ChildProcess | null = null;
  private isQuitting = false;

  constructor() {
    this.setupApp();
    this.setupAutoUpdater();
    this.setupMenu();
  }

  private setupApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow();
      this.startMCPServer();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
      this.cleanup();
    });

    // Setup IPC handlers
    ipcMain.handle('get-server-status', () => {
      return {
        running: this.mcpServerProcess !== null && !this.mcpServerProcess.killed,
        port: 31415
      };
    });

    ipcMain.handle('restart-server', () => {
      this.restartMCPServer();
    });

    ipcMain.handle('open-logs', () => {
      const logsPath = path.join(app.getPath('userData'), 'logs');
      shell.openPath(logsPath);
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      icon: this.getIconPath(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false
    });

    // Load the status page
    this.mainWindow.loadFile(path.join(__dirname, '../resources/index.html'));

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Show startup notification
      notifier.notify({
        title: 'Foundry MCP Server',
        message: 'Server is starting up...',
        icon: this.getIconPath()
      });
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private getIconPath(): string {
    if (process.platform === 'win32') {
      return path.join(__dirname, '../resources/icon.ico');
    } else if (process.platform === 'darwin') {
      return path.join(__dirname, '../resources/icon.icns');
    } else {
      return path.join(__dirname, '../resources/icon.png');
    }
  }

  private startMCPServer(): void {
    try {
      const serverPath = path.join(process.resourcesPath, 'mcp-server', 'index.js');
      
      // Check if server exists
      if (!fs.existsSync(serverPath)) {
        this.showError('MCP Server not found', 'The MCP server executable could not be found.');
        return;
      }

      // Start the MCP server process
      this.mcpServerProcess = spawn('node', [serverPath], {
        cwd: path.dirname(serverPath),
        stdio: 'pipe'
      });

      this.mcpServerProcess.on('error', (error) => {
        console.error('MCP Server error:', error);
        this.showError('MCP Server Error', `Failed to start MCP server: ${error.message}`);
      });

      this.mcpServerProcess.on('exit', (code, signal) => {
        console.log(`MCP Server exited with code ${code} and signal ${signal}`);
        this.mcpServerProcess = null;
        
        if (!this.isQuitting && code !== 0) {
          this.showError('MCP Server Stopped', 'The MCP server has stopped unexpectedly.');
        }
      });

      // Log server output
      if (this.mcpServerProcess.stdout) {
        this.mcpServerProcess.stdout.on('data', (data) => {
          console.log('MCP Server:', data.toString());
        });
      }

      if (this.mcpServerProcess.stderr) {
        this.mcpServerProcess.stderr.on('data', (data) => {
          console.error('MCP Server Error:', data.toString());
        });
      }

      // Notify successful start
      setTimeout(() => {
        notifier.notify({
          title: 'Foundry MCP Server',
          message: 'Server is running on port 31415',
          icon: this.getIconPath()
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to start MCP server:', error);
      this.showError('Startup Error', `Failed to start MCP server: ${error}`);
    }
  }

  private restartMCPServer(): void {
    if (this.mcpServerProcess) {
      this.mcpServerProcess.kill();
      this.mcpServerProcess = null;
    }
    
    setTimeout(() => {
      this.startMCPServer();
    }, 1000);
  }

  private cleanup(): void {
    if (this.mcpServerProcess && !this.mcpServerProcess.killed) {
      this.mcpServerProcess.kill();
      this.mcpServerProcess = null;
    }
  }

  private showError(title: string, message: string): void {
    dialog.showErrorBox(title, message);
  }

  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      notifier.notify({
        title: 'Update Available',
        message: 'A new version is available and will be downloaded in the background.',
        icon: this.getIconPath()
      });
    });

    autoUpdater.on('update-downloaded', () => {
      notifier.notify({
        title: 'Update Ready',
        message: 'Update downloaded. It will be installed on restart.',
        icon: this.getIconPath()
      });
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Restart Server',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.restartMCPServer()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'View Logs',
            click: () => {
              const logsPath = path.join(app.getPath('userData'), 'logs');
              shell.openPath(logsPath);
            }
          },
          {
            label: 'About',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About Foundry MCP Server',
                message: 'Foundry MCP Server',
                detail: 'Professional MCP server for Foundry VTT AI model integration.\n\nVersion 0.4.5\nDeveloped by Adam Dooley'
              });
            }
          },
          {
            label: 'GitHub Repository',
            click: () => {
              shell.openExternal('https://github.com/adambdooley/foundry-vtt-mcp-integration');
            }
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          {
            label: 'About Foundry MCP Server',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
          {
            label: 'Hide Foundry MCP Server',
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            role: 'hideOthers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// Create and initialize the app
new FoundryMCPServerApp();