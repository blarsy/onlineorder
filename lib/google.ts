import { GoogleAuth } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { google, drive_v3, sheets_v4 } from 'googleapis'
import { Readable } from 'stream'
import { OrderData } from './common'
import config from './serverConfig'

export const getSheets = () : sheets_v4.Sheets => {
    const auth = new google.auth.JWT(config.googleServiceAccount, undefined, config.googlePrivateKey, 'https://www.googleapis.com/auth/spreadsheets')
    return google.sheets({version: 'v4', auth})
}

export const connectSpreadsheet = async (sheetId: string): Promise<GoogleSpreadsheet> =>  {
    const doc = new GoogleSpreadsheet(sheetId)

    await doc.useServiceAccountAuth({
        client_email: config.googleServiceAccount,
        private_key: config.googlePrivateKey
    })

    await doc.loadInfo()
    return doc
}

let service: drive_v3.Drive
export const connectDrive = async (): Promise<drive_v3.Drive> => {

    if(!service) {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive',
            credentials: {
                client_email: config.googleServiceAccount,
                private_key: config.googlePrivateKey
            }
        })
    
        service = google.drive({version: 'v3', auth})
    }
    return service
}

let workingFolder : drive_v3.Schema$File
export const getWorkingFolder = async (service: drive_v3.Drive, folderName: string): Promise<drive_v3.Schema$File> => {
    if(!workingFolder) {
        const res = await service.files.list({
            q: `name = '${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id, name)',
            spaces: 'drive',
        })
        if (res.data?.files?.length === 1) {
            workingFolder = res.data.files[0]
        } else {
            throw new Error(`Remote working folder ${folderName} not found`)
        }
    }
    return workingFolder
}

const getChildFolder = async (service: drive_v3.Drive, folderName: string, parentFolderId: string): Promise<drive_v3.Schema$File | null> => {
    const res = await service.files.list({
        q: `name = '${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
        fields: 'files(id, name)',
        spaces: 'drive',
    })
    if (res.data?.files?.length === 1) {
        return res.data.files[0]
    } else {
        return null
    }
}

export const getOrCreateFolder = async (service: drive_v3.Drive, folderName: string, parentFolderId: string): Promise<drive_v3.Schema$File> => {
    let folder = await getChildFolder(service, folderName, parentFolderId)
    if(!folder){
        const res = await service.files.create({ 
            requestBody: {
              parents: [parentFolderId],
              name: folderName,
              mimeType:  'application/vnd.google-apps.folder'
            }
        })
        if (res.status === 200) {
            folder = res.data
        } else {
            throw new Error(`remote folder creation failed with status ${res.status} : ${res.statusText}`)
        }
    }
    return folder
}

export const updateFile = async (service: drive_v3.Drive, fileId: string, content: object): Promise<void> => {
    const res = await service.files.update({
        fileId: fileId,
        media:{
          body: Readable.from([JSON.stringify(content)])
        }
      })
}

export const createOrReplaceOrderFile = async (service: drive_v3.Drive, slug: string, parentFolderId: string, content: object): Promise<void> => {
    const existingFileId = await getFileId(service, slug + '.json', parentFolderId)
    let res
    if (existingFileId) {
        res = await service.files.update({
            fileId: existingFileId,
            media:{
              body: Readable.from([JSON.stringify(content)])
            }
          })
    } else {
        res = await service.files.create({
            media:{
              body: Readable.from([JSON.stringify(content)]),
              mimeType:  'application/json',
            },
            requestBody: {
              parents: [parentFolderId],
              name: `${slug}.json`,
            }
          })
    }

    if (res.status != 200) {
        throw new Error(`remote file creation/update failed with status ${res.status} : ${res.statusText}`)
    }
}

export const getFileContent = async (service: drive_v3.Drive, fileId: string):Promise<string> => {
    const fileContent = await service.files.get({
        fileId: fileId, 
        alt:'media'
      }, {responseType: 'stream'})
    return new Promise((resolve, reject) => {
        let content = ''
        fileContent.data.on('end', () => {
            resolve(content)
        })
        fileContent.data.on('data', data => content += data)
        fileContent.data.on('error', e => reject(e))
    })
}

export const getFileId = async (service: drive_v3.Drive, name: string, parentFolderId: string): Promise<string> => {
    const res = await service.files.list({
        q: `name = '${name}' and '${parentFolderId}' in parents`,
        fields: 'files(id)',
        spaces: 'drive',
    })
    if (res.data?.files?.length === 1) {
        return res.data.files[0].id!
    } else {
        return ''
    }
}

const archiveFile = async (service: drive_v3.Drive, fileId: string, archivePrefix: string, parentFolderId: string) => {
    await service.files.copy({
        fileId,
        requestBody: {
            name: (`${archivePrefix}${Number(new Date())}`),
            parents: [parentFolderId]
        }
    })
    await service.files.delete({
        fileId
    })
}

export const createRemoteFile = async (service: drive_v3.Drive, fileContent: object, fileName: string, workingFolderName: string) : Promise<drive_v3.Schema$File> => {
    const parentFolder = await getWorkingFolder(service, workingFolderName)
    const existingDataFileId = await getFileId(service, fileName, parentFolder.id!)
  
    if(existingDataFileId) {
      await archiveFile(service, existingDataFileId, fileName, parentFolder.id!)
    }
  
    const res = await service.files.create({ 
      media:{
        body: Readable.from([JSON.stringify(fileContent)]),
        mimeType:  'application/json',
      },
      requestBody: {
        parents: [parentFolder.id!],
        name: fileName,
      }
    })
    if (res.status === 200) {
      return res.data
    } else {
      throw new Error(`remote file creation failed with status ${res.status} : ${res.statusText}`)
    }
}

export const getOrdersInFolder = async (service: drive_v3.Drive, folderId: string): Promise<OrderData[]> => {
    const list = await service.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id)',
        spaces: 'drive',
    })
    if(list.data && list.data.files){
        return Promise.all(list.data.files.map(file => new Promise<OrderData>(async (resolve, reject) => {
            try {
                const content = await getFileContent(service, file.id!)
                resolve(JSON.parse(content) as OrderData)
            } catch(e) {
                reject(e)
            }
        })))
    } else {
        return []
    }
}