interface ElectronAPI {
  invoke: (data: unknown) => Promise<unknown>;
  send: (channel: string, data: unknown) => void;
  on: (channel: string, callback: (data: unknown) => void) => void;
  removeListener: (channel: string, callback: (data: unknown) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

