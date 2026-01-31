import { safeStorage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const TOKEN_FILE = 'github-token.enc'

export function registerTokenAPI(
  ipcMain: Electron.IpcMain,
  app: Electron.App,
  mainWindow: Electron.BrowserWindow | null
) {
  const tokenPath = () => path.join(app.getPath('userData'), TOKEN_FILE)

  ipcMain.handle('token:get', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }

    const filePath = tokenPath()
    if (!fs.existsSync(filePath)) {
      return null
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available')
    }

    const encrypted = fs.readFileSync(filePath)
    return safeStorage.decryptString(encrypted)
  })

  ipcMain.handle('token:save', async (event, token: string) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available')
    }

    const encrypted = safeStorage.encryptString(token)
    fs.writeFileSync(tokenPath(), encrypted)
    return { success: true }
  })

  ipcMain.handle('token:delete', async event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('Unauthorized IPC call')
    }

    const filePath = tokenPath()
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  })
}
