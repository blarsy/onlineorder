import { GoogleSpreadsheet } from 'google-spreadsheet'
import { drive_v3 } from 'googleapis'
import { ProductData, CustomerData, NonLocalProductData, SalesCycle, AvailableDeliveryTime, restoreTypes } from '../common'
import { getWorkingFolder, connectSpreadsheet, connectDrive, createRemoteFile, updateFile, getFileContent, getFileId } from './google'
import { getProductsForOnlineOrdering } from './odoo'
import { calculateQuantity, parseProductSheet } from './productQuantitiesSheet'
import { create as createVolumesFile } from './volumesFile'
import config from '../serverConfig'
import { createProductTables, getInsertionPoint } from './offerFile'

const getCustomerData = async(doc: GoogleSpreadsheet):Promise<CustomerData[]> => {
    const sheet = doc.sheetsByTitle['Clients']
    await sheet.loadCells()
    
    const customers = [] as CustomerData[]
    let i = 1, title='dummy', email, mobileNumber, slug, customerName, id
    while(title) {
        id = sheet.getCell(i, 5).value as number
        title = sheet.getCell(i, 0).value as string
        email = sheet.getCell(i, 1).value as string
        mobileNumber = sheet.getCell(i, 2).value as string
        slug = sheet.getCell(i, 3).value as string
        customerName = sheet.getCell(i, 4).value as string
        if(title) {
          customers.push({id, title, email, mobileNumber, slug, customerName})
        }
        i ++
    }
    return customers
}

export const getCampaignProductsData = async(docCustomersAndOther : GoogleSpreadsheet, sourceSheetId: number): Promise<{ products: ProductData[], nonLocalProducts: NonLocalProductData[]}> => {
  const quantitiesDataPromise = parseProductSheet(config.googleSheetIdProducts, sourceSheetId, )
  const productsByCategoriesPromise = getProductsForOnlineOrdering()

  const nonLocalProductsPackagingsPromise = getNonLocalProductsPackaging(docCustomersAndOther)
  const productsByCategories = await productsByCategoriesPromise
  const nonLocalProductsPackagings = await nonLocalProductsPackagingsPromise
  const products = [] as ProductData[]
  const nonLocalProducts = [] as NonLocalProductData[]
  const quantitiesData = await quantitiesDataPromise

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
        const quantity = calculateQuantity(quantitiesData, product.id)

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

  return { products, nonLocalProducts }
}

export const createDataFile = async (deliveryDate: Date, deadline: Date, sourceSheetId: number, availableDeliveryTimes: AvailableDeliveryTime[]): Promise<drive_v3.Schema$File> => {
    const servicePromise = connectDrive()
    const insertionPointPromise = getInsertionPoint()
    const docCustomersAndOther = await connectSpreadsheet(config.googleSheetIdCustomers)

    const customersPromise = getCustomerData(docCustomersAndOther)    
    
    const { products, nonLocalProducts } = await getCampaignProductsData(docCustomersAndOther, sourceSheetId)
    const insertionPoint = await insertionPointPromise
    const createProductTablesPromise= createProductTables(products, nonLocalProducts, insertionPoint)

    const customers = await customersPromise

    const salesCycle = {products, nonLocalProducts, customers, availableDeliveryTimes,
      deliveryDate, creationDate: new Date(), deadline }

    const createVolumesFilePromise = createVolumesFile(salesCycle)
    const service = await servicePromise
    const result = await createRemoteFile(service, salesCycle, config.workingFileName, config.workingFolderName)
    await createVolumesFilePromise
    await createProductTablesPromise
    return result
}

export const updateCustomers = async() : Promise<void> => {
  const dataFileContentPromise = getDataFileContent()
  const docCustomersAndOther = await connectSpreadsheet(config.googleSheetIdCustomers)

  const customersPromise = getCustomerData(docCustomersAndOther)
  const currentContent = await dataFileContentPromise
  const customers = await customersPromise
  
  await updateDataFile({ ...currentContent, ...{customers}})
}

// Will NOT remove the product when they have been archived in Odoo
export const updateProducts = async(sourceSheetId: number) : Promise<void> => {
  const quantitiesPromise = parseProductSheet(config.googleSheetIdProducts, sourceSheetId)
  const productsPromise = getProductsForOnlineOrdering()
  const currentContent = await getDataFileContent()

  const products = await productsPromise
  const quantities = await quantitiesPromise
  const onlineProductsMap = {} as {[id: number]: ProductData}
  currentContent.products.forEach(product => onlineProductsMap[product.id] = product)

  Object.keys(products).forEach(cat => {
    products[cat].forEach(odooProduct => {
      const productToUpdate = onlineProductsMap[odooProduct.id]
      if(!productToUpdate) {
        // add product that were added to Odoo
        const quantity = calculateQuantity(quantities, odooProduct.id)
        if(quantity > 0) {
          currentContent.products.push(<ProductData>{
            id: odooProduct.id,
            name: odooProduct.name,
            price: odooProduct.sellPrice,
            unit: odooProduct.unit,
            category: cat,
            quantity
          })
        }
      } else {
        // Update date from Odoo and quantities sheet
        productToUpdate.name = odooProduct.name
        productToUpdate.price = odooProduct.sellPrice
        productToUpdate.unit = odooProduct.unit
        productToUpdate.quantity = calculateQuantity(quantities, odooProduct.id)
      } 
    })
  })

  await updateDataFile(currentContent)
}

const updateDataFile = async(newContent: SalesCycle): Promise<void> => {
  const service = await connectDrive()
  const fileId = await getDataFileId(service)
  return updateFile(service, fileId, newContent)
}

const getDataFileId = async(service: drive_v3.Drive): Promise<string> => {
  const workingFolder = await getWorkingFolder(service, config.workingFolderName)

  return getFileId(service, config.workingFileName, workingFolder.id!)
}

export const getDataFileContent = async (): Promise<SalesCycle> => {
  const service = await connectDrive()
  const dataFileId = await getDataFileId(service)
  
  if(!dataFileId){
    throw new Error('No campaign found')
  }

  const salesCycle =JSON.parse(await getFileContent(service, dataFileId!))as SalesCycle
  restoreTypes(salesCycle)

  return salesCycle
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

