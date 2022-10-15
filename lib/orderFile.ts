import { drive_v3 } from "googleapis";
import { CustomerData, OrderData, OrderStatus } from "./common";
import { connectDrive, createOrReplaceFile, getOrCreateFolder, getWorkingFolder, getFileContent, getFileId } from "./google"

const workingFolderName = process.env.WORKING_FOLDER_NAME!

const weekFileName = (weekNumber: number, year: number) => `${year}-${weekNumber}`

export const saveOrder = async (order : OrderData, slug: string, weekNumber: number, year: number): Promise<void> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)

    if(order && order.status === OrderStatus.confirmed && !order.confirmationDateTime) {
        order.confirmationDateTime = new Date()
    }

    await createOrReplaceFile(service, slug, weekFolder.id!, order!)
}

export const getOrder = async (weekNumber: number, year: number, slug: string): Promise<OrderData | null> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)
    const fileId = await getFileId(service, slug + '.json', weekFolder.id!)
    if(fileId){
        const fileContent = await getFileContent(service, fileId)
        return JSON.parse(fileContent) as OrderData
    }
    return null
}
