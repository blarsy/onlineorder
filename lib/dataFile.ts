import { GoogleSpreadsheet } from 'google-spreadsheet'
import { drive_v3 } from 'googleapis'
import { ProductData, CustomerData, NonLocalProductData, SalesCycle } from './common'
import { getWorkingFolder, connectSpreadsheet, connectDrive, createRemoteFile, updateFile } from './google'
import { create as createVolumesFile } from './volumesFile'


const googleSheetIdProducts = process.env.GOOGLE_SHEET_ID_PRODUCTS!
const googleSheetIdCustomers = process.env.GOOGLE_SHEET_ID_CUSTOMERS!
const workingFileName = process.env.WORKING_FILE_NAME!
const workingFolderName = process.env.WORKING_FOLDER_NAME!

let id = 0
const nextId = () => {
  id ++
  return id
}

const getProductData = async(doc: GoogleSpreadsheet):Promise<ProductData[]> => {
    const sheet = doc.sheetsByTitle['Produits']
    await sheet.loadCells()
    
    const availableProducts = [] as ProductData[]
    let i = 0, name = 'dummy', category, price, unit, quantity, quantityPerSmallCrate : number | undefined, quantityPerBigCrate : number | undefined
    while(name) {
        category = sheet.getCell(i, 0).value as string
        name = sheet.getCell(i, 1).value as string
        unit = sheet.getCell(i, 2).value as string
        quantity = sheet.getCell(i, 3).value as number
        price = sheet.getCell(i, 4).value as number
        if(name && quantity > 0) {
          availableProducts.push({id: nextId(), name, category, quantity, price, unit, quantityPerSmallCrate, quantityPerBigCrate})
        }
        i ++
    }
    return availableProducts
}

const getCustomerData = async(doc: GoogleSpreadsheet):Promise<CustomerData[]> => {
    const sheet = doc.sheetsByTitle['Clients']
    await sheet.loadCells()
    
    const customers = [] as CustomerData[]
    let i = 1, title='dummy', email, mobileNumber, slug, customerName
    while(title) {
        title = sheet.getCell(i, 0).value as string
        email = sheet.getCell(i, 1).value as string
        mobileNumber = sheet.getCell(i, 2).value as string
        slug = sheet.getCell(i, 3).value as string
        customerName = sheet.getCell(i, 4).value as string
        if(title) {
          customers.push({title, email, mobileNumber, slug, customerName})
        }
        i ++
    }
    return customers
}

export const createDataFile = async (weekNumber: number, year: number, deadline: Date): Promise<drive_v3.Schema$File> => {
    const docProducts = await connectSpreadsheet(googleSheetIdProducts)
    const docCustomersAndOther = await connectSpreadsheet(googleSheetIdCustomers)

    const products = await getProductData(docProducts)
    const nonLocalProducts = await getNonLocalProducts(docCustomersAndOther)
    const customers = await getCustomerData(docCustomersAndOther)

    const salesCycle = {products, nonLocalProducts, customers, 
      targetWeek: { weekNumber, year }, creationDate: new Date(), deadline }

    const service = await connectDrive()
    const result = await createRemoteFile(service, salesCycle, workingFileName, workingFolderName)
    await createVolumesFile(salesCycle)
    return result
}

export const updateCustomers = async() : Promise<void> => {
  const docCustomersAndOther = await connectSpreadsheet(googleSheetIdCustomers)

  const customers = await getCustomerData(docCustomersAndOther)
  const currentContent = JSON.parse(await getDataFileContent()) as SalesCycle


  await updateDataFile({ ...currentContent, ...{customers}})
}

const updateDataFile = async(newContent: SalesCycle): Promise<void> => {
  const service = await connectDrive()
  const file = await getDataFile(service)
  updateFile(service, file!.id!, newContent)
}

const getDataFile = async(service: drive_v3.Drive): Promise<drive_v3.Schema$File | null> => {
  const workingFolder = await getWorkingFolder(service, workingFolderName)
  const res = await service.files.list({
    q: `name = '${workingFileName}' and '${workingFolder.id!}' in parents`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })
  if (res.data?.files?.length === 1) {
    return res.data!.files![0]
  } else {
    return null
  }
}

export const getDataFileContent = async (): Promise<string> => {
  const service = await connectDrive()
  const dataFile = await getDataFile(service)
  
  if(!dataFile){
    throw new Error(`Remote working file ${workingFileName} not found`)
  }

  const fileWithContent = await service.files.get({
    fileId: dataFile.id!, 
    alt:'media'
  }, {responseType: 'stream'})
  return new Promise((resolve, reject) => {
    let content = ''
    fileWithContent.data.on('end', () => {
      resolve(content)
    })
    fileWithContent.data.on('data', data => content += data)
    fileWithContent.data.on('error', e => reject(e))
  })
}

const getNonLocalProducts = async (doc: GoogleSpreadsheet): Promise<NonLocalProductData[]>  => {
  const sheet = doc.sheetsByTitle['Produits hors coopérative']
  await sheet.loadCells()
  
  const nonLocalProducts = [] as NonLocalProductData[]
  let i = 1, name='dummy', category, unit, packaging, price
  while(name) {
      category = sheet.getCell(i, 0).value as string
      name = sheet.getCell(i, 1).value as string
      unit = sheet.getCell(i, 2).value as string
      packaging = sheet.getCell(i, 3).value as number
      price = sheet.getCell(i, 4).value as number
      if(name) {
        nonLocalProducts.push({
          id: nextId(), category, name, unit, packaging, price
        })
      }
      i ++
  }
  return nonLocalProducts
}

