const googleSheetIdProducts = process.env.GOOGLE_SHEET_ID_PRODUCTS!
const googleSheetIdCustomers = process.env.GOOGLE_SHEET_ID_CUSTOMERS!
const workingFileName = process.env.WORKING_FILE_NAME!
const workingFolderName = process.env.WORKING_FOLDER_NAME!
const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT!
const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY ? JSON.parse(process.env.GOOGLE_PRIVATE_KEY!).privateKey : '' as string
const connectionInfo = process.env.ODOO_CONNECTION_INFO ? JSON.parse(process.env.ODOO_CONNECTION_INFO!).connectionInfo : '' as string
const volumesFileName = process.env.VOLUMES_FILE_NAME!
const authorizedSigners = process.env.AUTHORIZED_SIGNERS ? JSON.parse(process.env.AUTHORIZED_SIGNERS) as string[]: []

interface ServerConfig {
    googleSheetIdProducts: string
    googleSheetIdCustomers: string
    workingFileName: string
    workingFolderName: string
    googleServiceAccount: string
    googlePrivateKey: string
    connectionInfo: { baseUrl: string, db: string, username: string, password: string }
    volumesFileName: string
    authorizedSigners: string[],
    [prop: string]: any
}
let autoConfig = <ServerConfig> {
    googleSheetIdProducts, googleSheetIdCustomers, workingFileName, workingFolderName,
    googleServiceAccount, googlePrivateKey, connectionInfo, volumesFileName, authorizedSigners
}

export const setConfig = (data: {[prop: string]:any}): void => {
    Object.keys(data).forEach(prop => autoConfig[prop] = data[prop])
}

export default autoConfig