import { ID, Permission, Role } from 'node-appwrite'
import { getCookie } from '@tanstack/react-start/server'
import { createSessionClient } from './appwrite'

const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID

export async function fileStorage() {
  if (!APPWRITE_BUCKET_ID) {
    throw new Error('Missing APPWRITE_BUCKET_ID environment variable')
  }

  const sessionSecret = getCookie('appwrite-session-secret')

  if (!sessionSecret) {
    console.error('No valid session found')
    return
  }

  const { storage } = await createSessionClient(sessionSecret)

  return {
    create(userId: string, file: File) {
      return storage.createFile({
        bucketId: APPWRITE_BUCKET_ID,
        file,
        fileId: ID.unique(),
        permissions: [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      })
    },

    read(fileId: string) {
      return storage.getFileView({
        bucketId: APPWRITE_BUCKET_ID,
        fileId,
      })
    },

    delete(fileId: string) {
      return storage.deleteFile({
        bucketId: APPWRITE_BUCKET_ID,
        fileId,
      })
    },

    listFiles() {
      return storage.listFiles({
        bucketId: APPWRITE_BUCKET_ID,
      })
    },

    downloadFile(fileId: string) {
      return storage.getFileDownload({
        bucketId: APPWRITE_BUCKET_ID,
        fileId,
      })
    },
  }
}
