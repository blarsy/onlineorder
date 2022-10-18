import { OrderData, OrderedVolumes, SalesCycle } from "./common"
import { connectDrive, createRemoteFile, getFileContent, getFileId, getWorkingFolder, updateFile } from "./google"
import { handleOrderedVolumes } from "./orderVolumes"

const workingFolderName = process.env.WORKING_FOLDER_NAME!
const volumesFileName = process.env.VOLUMES_FILE_NAME!

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
        const workingFolder = await getWorkingFolder(service, workingFolderName)
        
        volumesFileId = await getFileId(service, volumesFileName, workingFolder.id!)
    }
    return volumesFileId
}

export const getOrderVolumes = async (): Promise<OrderedVolumes> => {
    const service = await connectDrive()
    const fileId = await getVolumesFileId()

    return (JSON.parse(await getFileContent(service, fileId))) as OrderedVolumes
}

export const create = async (salesCycle: SalesCycle):Promise<void> => {
    const initialStock = {} as OrderedVolumes

    salesCycle.products.forEach(product => {
        initialStock[product.id] = {
            orders: [] as {
                customerSlug: string,
                quantityOrdered: number
            }[],
            originalQuantity: product.quantity
        }
    })

    const service = await connectDrive()
    await createRemoteFile(service, initialStock, volumesFileName, workingFolderName)
}

export const registerOrderQuantities = async (order: OrderData, customerSlug: string): Promise<void> => {
    const service = await connectDrive()
    const fileId = await getVolumesFileId()
    const workingFolder = await getWorkingFolder(service, workingFolderName)

    await acquireLock()
    try {
        let content = JSON.parse(await getFileContent(service, fileId)) as OrderedVolumes
        content = handleOrderedVolumes(order, content, customerSlug)

        await updateFile(service, fileId, customerSlug, workingFolder.id!, content)
    } finally {
        releaseLock()
    }
}