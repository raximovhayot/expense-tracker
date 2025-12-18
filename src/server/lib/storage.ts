/**
 * File Storage Utilities
 * Uses Appwrite Storage with admin client
 */
import { ID, Permission, Role, Client, Storage } from 'node-appwrite'

const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID

function createStorageClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    throw new Error('Missing Appwrite configuration')
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey)

  return new Storage(client)
}

export async function fileStorage() {
  if (!APPWRITE_BUCKET_ID) {
    throw new Error('Missing APPWRITE_BUCKET_ID environment variable')
  }

  const storage = createStorageClient()

  return {
    create(userId: string, file: File) {
      return storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        file,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      )
    },

    read(fileId: string) {
      return storage.getFileView(APPWRITE_BUCKET_ID, fileId)
    },

    delete(fileId: string) {
      return storage.deleteFile(APPWRITE_BUCKET_ID, fileId)
    },

    listFiles() {
      return storage.listFiles(APPWRITE_BUCKET_ID)
    },

    downloadFile(fileId: string) {
      return storage.getFileDownload(APPWRITE_BUCKET_ID, fileId)
    },
  }
}
