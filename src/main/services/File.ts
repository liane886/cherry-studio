import { getFileType } from '@main/utils/file'
import { FileType } from '@types'
import * as crypto from 'crypto'
import { app, dialog, OpenDialogOptions } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

class File {
  private storageDir: string

  constructor() {
    this.storageDir = path.join(app.getPath('userData'), 'Data', 'Files')
    this.initStorageDir()
  }

  private initStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
    }
  }

  private async getFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(filePath)
      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  async findDuplicateFile(filePath: string): Promise<FileType | null> {
    const stats = fs.statSync(filePath)
    const fileSize = stats.size

    const files = await fs.promises.readdir(this.storageDir)
    for (const file of files) {
      const storedFilePath = path.join(this.storageDir, file)
      const storedStats = fs.statSync(storedFilePath)

      if (storedStats.size === fileSize) {
        const [originalHash, storedHash] = await Promise.all([
          this.getFileHash(filePath),
          this.getFileHash(storedFilePath)
        ])

        if (originalHash === storedHash) {
          const ext = path.extname(file)
          const id = path.basename(file, ext)
          return {
            id,
            origin_name: file,
            name: file + ext,
            path: storedFilePath,
            created_at: storedStats.birthtime,
            size: storedStats.size,
            ext,
            type: getFileType(ext),
            count: 2
          }
        }
      }
    }

    return null
  }

  async selectFile(options?: OpenDialogOptions): Promise<FileType[] | null> {
    const defaultOptions: OpenDialogOptions = {
      properties: ['openFile']
    }

    const dialogOptions = { ...defaultOptions, ...options }

    const result = await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const fileMetadataPromises = result.filePaths.map(async (filePath) => {
      const stats = fs.statSync(filePath)
      const ext = path.extname(filePath)
      const fileType = getFileType(ext)

      return {
        id: uuidv4(),
        origin_name: path.basename(filePath),
        name: path.basename(filePath),
        path: filePath,
        created_at: stats.birthtime,
        size: stats.size,
        ext: ext,
        type: fileType,
        count: 1
      }
    })

    return Promise.all(fileMetadataPromises)
  }

  async uploadFile(file: FileType): Promise<FileType> {
    const duplicateFile = await this.findDuplicateFile(file.path)

    if (duplicateFile) {
      return duplicateFile
    }

    const uuid = uuidv4()
    const origin_name = path.basename(file.path)
    const ext = path.extname(origin_name)
    const destPath = path.join(this.storageDir, uuid + ext)

    await fs.promises.copyFile(file.path, destPath)
    const stats = await fs.promises.stat(destPath)
    const fileType = getFileType(ext)

    const fileMetadata: FileType = {
      id: uuid,
      origin_name,
      name: uuid + ext,
      path: destPath,
      created_at: stats.birthtime,
      size: stats.size,
      ext: ext,
      type: fileType,
      count: 1
    }

    return fileMetadata
  }

  async deleteFile(id: string): Promise<void> {
    await fs.promises.unlink(path.join(this.storageDir, id))
  }
}

export default File
