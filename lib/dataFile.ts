import { GoogleSpreadsheet } from 'google-spreadsheet'
import { drive_v3 } from 'googleapis'
import { ProductData, CustomerData, NonLocalProductData, SalesCycle } from './common'
import { getWorkingFolder, connectSpreadsheet, connectDrive, createRemoteFile, updateFile, getFileContent, getFileId } from './google'
import { getProductsForOnlineOrdering } from './odoo'
import { parseProductSheet } from './productQuantitiesSheet'
import { create as createVolumesFile } from './volumesFile'
import config from './serverConfig'

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

export const createDataFile = async (deliveryDate: Date, deadline: Date, sourceSheetId: number): Promise<drive_v3.Schema$File> => {
    const customerSheetId = config.googleSheetIdCustomers
    const docCustomersAndOther = await connectSpreadsheet(customerSheetId)

    const customers = await getCustomerData(docCustomersAndOther)
    const quantitiesData = await parseProductSheet(config.googleSheetIdProducts, sourceSheetId)
    const productsByCategories = await getProductsForOnlineOrdering()
    const nonLocalProductsPackagings = await getNonLocalProductsPackaging(docCustomersAndOther)
    const products = [] as ProductData[]
    const nonLocalProducts = [] as NonLocalProductData[]

    Object.keys(productsByCategories).forEach(cat => {
      if(cat.endsWith(' hors coopérative')) {
        productsByCategories[cat].forEach(product => {
          if(nonLocalProductsPackagings[product.id]){
            const targetCategory = cat.substring(0, cat.length - ' hors coopérative'.length)

            nonLocalProducts.push({
              category: targetCategory,
              id: product.id,
              name: product.name,
              price: product.sellPrice,
              unit: product.unit,
              packaging: nonLocalProductsPackagings[product.id]
            })
          }
        })
      } else {
        productsByCategories[cat].forEach(product => {
          const producerQuantities = quantitiesData.productQuantities[product.id] ? quantitiesData.productQuantities[product.id].producerQuantities : {}
          const plannedCropsQuantities = quantitiesData.productQuantitiesPlannedCrops[product.id] ? quantitiesData.productQuantitiesPlannedCrops[product.id].producerQuantities : {}
          const inStockQuantity = (typeof quantitiesData.productQuantitiesInStock[product.id] === 'number') ? quantitiesData.productQuantitiesInStock[product.id] as number : 0

          const quantity = Object.keys(producerQuantities).reduce<number>((acc, producerId) => 
            acc + (typeof producerQuantities[Number(producerId)] === 'number' ? producerQuantities[Number(producerId)] as number : 0), 0) +
            Object.keys(plannedCropsQuantities).reduce((acc, producerId) => 
            acc + (typeof plannedCropsQuantities[Number(producerId)] === 'number' ? plannedCropsQuantities[Number(producerId)] as number : 0), 0) +
            inStockQuantity

          if(quantity > 0) {
            products.push({
              category: cat,
              id: product.id,
              name: product.name,
              price: product.sellPrice,
              unit: product.unit,
              quantity
            })
          }
        })
      }
    })

    const salesCycle = {products, nonLocalProducts, customers, 
      deliveryDate, creationDate: new Date(), deadline }

    const service = await connectDrive()
    const result = await createRemoteFile(service, salesCycle, config.workingFileName, config.workingFolderName)
    await createVolumesFile(salesCycle)
    return result
}

export const updateCustomers = async() : Promise<void> => {
  const docCustomersAndOther = await connectSpreadsheet(config.googleSheetIdCustomers)

  const customers = await getCustomerData(docCustomersAndOther)
  const currentContent = JSON.parse(await getDataFileContent()) as SalesCycle


  await updateDataFile({ ...currentContent, ...{customers}})
}

const updateDataFile = async(newContent: SalesCycle): Promise<void> => {
  const service = await connectDrive()
  const fileId = await getDataFileId(service)
  updateFile(service, fileId, newContent)
}

const getDataFileId = async(service: drive_v3.Drive): Promise<string> => {
  const workingFolder = await getWorkingFolder(service, config.workingFolderName)

  return await getFileId(service, config.workingFileName, workingFolder.id!)
}

export const getDataFileContent = async (): Promise<string> => {
  const service = await connectDrive()
  const dataFileId = await getDataFileId(service)
  
  if(!dataFileId){
    throw new Error(`Remote working file ${config.workingFileName} not found`)
  }

  return getFileContent(service, dataFileId!)
}

const getNonLocalProductsPackaging = async (doc: GoogleSpreadsheet): Promise<{[productId: number]:number}>  => {
  const sheet = doc.sheetsByTitle['Produits hors coopérative - conditionnements']
  await sheet.loadCells()
  
  const result = {} as {[productId: number]: number}
  let i = 1, name='dummy', packaging, id
  while(name) {
    id = sheet.getCell(i, 0).value as number
    name = sheet.getCell(i, 1).value as string
    packaging = sheet.getCell(i, 2).value as number
    if(name) {
      result[id] = packaging
    }
    i ++
  }
  return result
}

