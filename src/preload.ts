import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  platform: process.platform,
  send: (channel: string, data: unknown): void => {
    const validChannels = ['window-control']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  onWindowMaximized: (callback: () => void) => {
    ipcRenderer.on('window-maximized', _event => callback())
  },
  onWindowUnmaximized: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', _event => callback())
  },
}

const githubAPI = {
  initialize: (token: string) => ipcRenderer.invoke('github:initialize', token),
  updateToken: (token: string) =>
    ipcRenderer.invoke('github:updateToken', token),
  getInProgress: () => ipcRenderer.invoke('github:getInProgress'),
  getAll: () => ipcRenderer.invoke('github:getAll'),
  sync: () => ipcRenderer.invoke('github:sync'),
  getDetails: (notificationId: string) =>
    ipcRenderer.invoke('github:getDetails', notificationId),
  markAsRead: (notificationId: string) =>
    ipcRenderer.invoke('github:markAsRead', notificationId),
  markAsDone: (notificationId: string) =>
    ipcRenderer.invoke('github:markAsDone', notificationId),
  markAsUnread: (notificationId: string) =>
    ipcRenderer.invoke('github:markAsUnread', notificationId),
  setPriority: (notificationId: string, priority: number) =>
    ipcRenderer.invoke('github:setPriority', notificationId, priority),
  getStats: () => ipcRenderer.invoke('github:getStats'),
}

const tokenAPI = {
  get: () => ipcRenderer.invoke('token:get'),
  save: (token: string) => ipcRenderer.invoke('token:save', token),
  delete: () => ipcRenderer.invoke('token:delete'),
}

// Security: Expose only the defined API, nothing else
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
contextBridge.exposeInMainWorld('githubAPI', githubAPI)
contextBridge.exposeInMainWorld('tokenAPI', tokenAPI)

// Security: Prevent any modifications to the exposed API
Object.freeze(electronAPI)
Object.freeze(githubAPI)
Object.freeze(tokenAPI)
