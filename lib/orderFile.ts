import { OrderData, OrderStatus } from "./common";
import { connectDrive, createOrReplaceFile, getOrCreateFolder, getWorkingFolder, getFileContent, getFileId } from "./google"
import { ordersIdentical } from "./orderVolumes";
import { registerOrderQuantities } from "./volumesFile";

const workingFolderName = process.env.WORKING_FOLDER_NAME!

const weekFileName = (weekNumber: number, year: number) => `${year}-${weekNumber}`

export const saveOrder = async (order : OrderData, customerSlug: string, weekNumber: number, year: number): Promise<void> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)

    if(order && order.status === OrderStatus.confirmed && !order.confirmationDateTime) {
        order.confirmationDateTime = new Date()
        await registerOrderQuantities(order, customerSlug)
    }

    await createOrReplaceFile(service, customerSlug, weekFolder.id!, order!)
}

export const getOrder = async (weekNumber: number, year: number, slug: string): Promise<{order: OrderData, fileId: string} | null> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)
    const fileId = await getFileId(service, slug + '.json', weekFolder.id!)
    if(fileId){
        const fileContent = await getFileContent(service, fileId)
        return {order: JSON.parse(fileContent) as OrderData, fileId}
    }
    return null
}
