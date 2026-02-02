import { NotificationManager } from '../github-store'

export function registerGithubAPI(
  ipcMain: Electron.IpcMain,
  app: Electron.App,
  mainWindow: Electron.BrowserWindow | null
) {
  let notificationManager: NotificationManager | null = null

  // GitHub Notifications IPC Handlers
  ipcMain.handle('github:initialize', async (event, token: string) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    const storagePath = app.getPath('userData')
    notificationManager = new NotificationManager(token, 10, storagePath)
    await notificationManager.validateToken()

    return { success: true }
  })

  ipcMain.handle('github:updateToken', async (event, token: string) => {
    const storagePath = app.getPath('userData')
    notificationManager = new NotificationManager(token, 10, storagePath)
    await notificationManager.resetStorage()
    await notificationManager.validateToken()
    return { success: true }
  })

  ipcMain.handle('github:getInProgress', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.getInProgress()
  })

  ipcMain.handle('github:getAll', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.getAll()
  })

  ipcMain.handle('github:sync', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.sync()
  })

  ipcMain.handle('github:getDetails', async (event, notificationId: string) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.getNotificationDetails(notificationId)
  })

  ipcMain.handle('github:markAsRead', async (event, notificationId: string) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.markAsRead(notificationId)
  })

  ipcMain.handle('github:markAsDone', async (event, notificationId: string) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return await notificationManager.markAsDone(notificationId)
  })

  ipcMain.handle(
    'github:markAsUnread',
    async (event, notificationId: string) => {
      if (!mainWindow || event.sender !== mainWindow.webContents) {
        throw new Error('Unauthorized IPC call')
      }
      if (!notificationManager) {
        throw new Error('Notification manager not initialized')
      }
      return await notificationManager.markAsUnread(notificationId)
    }
  )

  ipcMain.handle(
    'github:setPriority',
    async (event, notificationId: string, priority: number) => {
      if (!mainWindow || event.sender !== mainWindow.webContents) {
        throw new Error('Unauthorized IPC call')
      }
      if (!notificationManager) {
        throw new Error('Notification manager not initialized')
      }
      return await notificationManager.setPriority(notificationId, priority)
    }
  )

  ipcMain.handle('github:getStats', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }
    if (!notificationManager) {
      throw new Error('Notification manager not initialized')
    }
    return notificationManager.getStats()
  })
}
