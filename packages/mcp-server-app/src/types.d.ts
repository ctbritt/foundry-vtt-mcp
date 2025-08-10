interface ElectronAPI {
  getServerStatus(): Promise<{
    running: boolean;
    port: number;
  }>;
  restartServer(): Promise<void>;
  openLogs(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}