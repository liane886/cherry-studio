import db from '@renderer/databases'
import { FileType } from '@renderer/types'

class FileManager {
  static async selectFiles(options?: Electron.OpenDialogOptions): Promise<FileType[] | null> {
    const files = await window.api.file.select(options)
    return files
  }

  static async uploadFile(file: FileType): Promise<FileType> {
    const uploadFile = await window.api.file.upload(file)
    const fileRecord = await db.files.get(uploadFile.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    await db.files.add(uploadFile)

    return uploadFile
  }

  static async uploadFiles(files: FileType[]): Promise<FileType[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)))
  }

  static async getFile(id: string): Promise<FileType | undefined> {
    return db.files.get(id)
  }

  static async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id)

    if (!file) {
      return
    }

    if (file.count > 1) {
      await db.files.update(id, { ...file, count: file.count - 1 })
      return
    }

    await window.api.file.delete(id + file.ext)
    db.files.delete(id)
  }

  static async deleteFiles(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deleteFile(id)))
  }

  static async allFiles(): Promise<FileType[]> {
    return db.files.toArray()
  }
}

export default FileManager
