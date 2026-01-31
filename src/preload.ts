import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  invoke: async (data: unknown): Promise<unknown> => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data');
    }
    
    return ipcRenderer.invoke('secure-invoke', data);
  },

  send: (channel: string, data: unknown): void => {
    const validChannels = ['channel1', 'channel2'];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      throw new Error(`Invalid channel: ${channel}`);
    }
  },
  on: (channel: string, callback: (data: unknown) => void): void => {
    const validChannels = ['response1', 'response2'];
    
    if (validChannels.includes(channel)) {
      // Wrap callback to prevent exposing event object
      ipcRenderer.on(channel, (_event, data) => callback(data));
    } else {
      throw new Error(`Invalid channel: ${channel}`);
    }
  },
  removeListener: (channel: string, callback: (data: unknown) => void): void => {
    const validChannels = ['response1', 'response2'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
};

// Security: Expose only the defined API, nothing else
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Security: Prevent any modifications to the exposed API
Object.freeze(electronAPI);
