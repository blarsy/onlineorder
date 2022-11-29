import { OrderData, OrderedVolumes, SalesCycle } from "../common"
import { connectDrive, createRemoteFile, getFileContent, getFileId, getWorkingFolder, updateFile } from "./google"
import { handleOrderedVolumes } from "./orderVolumes"
import config from '../serverConfig'

let locked = false
const acquireLock = async (): Promise<void> => {
    if(!locked) {
        locked = true
        return
    } else {
        await new Promise(resolve => setTimeout(resolve, 1500))
        return await acquireLock()
    }
}
const releaseLock = () => locked = false

let volumesFileId: string
const getVolumesFileId = async () => {
    if(!volumesFileId) {
        const service = await connectDrive()
        const workingFolder = await getWorkingFolder(service, config.workingFolderName)
        
        volumesFileId = await getFileId(service, config.volumesFileName, workingFolder.id!)
    }
    return volumesFileId
}

export const getOrderVolumes = async (): Promise<OrderedVolumes> => {
    const service = await connectDrive()
    const fileId = await getVolumesFileId()

    const fileContent = await getFileContent(service, fileId)
    if(!fileContent){
        throw new Error('Could not get volumes file content')
    }

    return JSON.parse(fileContent) as OrderedVolumes
}

export const create = async (salesCycle: SalesCycle):Promise<void> => {
    const initialStock = {} as OrderedVolumes
    const servicePromise = connectDrive()


    salesCycle.products.forEach(product => {
        initialStock[product.id] = {
            orders: [] as {
                customerSlug: string,
                quantityOrdered: number
            }[],
            originalQuantity: product.quantity
        }
    })

    const service = await servicePromise
    const newFile = await createRemoteFile(service, initialStock, config.volumesFileName, config.workingFolderName)
    volumesFileId = newFile.id!
}

export const updateQuantities = async (updatedQuantities: {[productId: number]: number}): Promise<void> => {
    const servicePromise = connectDrive()
    const fileId = await getVolumesFileId()

    const service = await servicePromise
    await acquireLock()
    try {
        let content = JSON.parse(await getFileContent(service, fileId)) as OrderedVolumes
        Object.keys(updatedQuantities).forEach(productId => {
            //look for new products
            if(!content[Number(productId)]) {
                content[Number(productId)] = {
                    orders: [],
                    originalQuantity: updatedQuantities[Number(productId)]
                }
            } else {
                const quantitiesOrdered = content[Number(productId)].orders.reduce<number>((acc, orderQuantity) => acc += orderQuantity.quantityOrdered, 0)
                if(quantitiesOrdered > updatedQuantities[Number(productId)]) {
                    //prevent quantities to fall below what has already been ordered
                    content[Number(productId)].originalQuantity = quantitiesOrdered
                } else {
                    content[Number(productId)].originalQuantity = updatedQuantities[Number(productId)]
                }
            }
        })

        return updateFile(service, fileId, content)
    } finally {
        releaseLock()
    }
}

export const registerOrderQuantities = async (order: OrderData, customerSlug: string): Promise<void> => {
    const service = await connectDrive()
    const fileId = await getVolumesFileId()

    await acquireLock()
    try {
        let content = JSON.parse(await getFileContent(service, fileId)) as OrderedVolumes
        content = handleOrderedVolumes(order, content, customerSlug)

        return updateFile(service, fileId, content)
    } finally {
        releaseLock()
    }
}