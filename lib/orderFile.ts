import { OrderCustomer, OrderData, OrderStatus, SalesCycle, CustomerData } from "./common";
import { getDataFileContent } from "./dataFile";
import { connectDrive, createOrReplaceFile, getOrCreateFolder, getWorkingFolder, getFileContent, getFileId, getOrdersInFolder } from "./google"
import { ordersIdentical } from "./orderVolumes";
import { registerOrderQuantities } from "./volumesFile";

const workingFolderName = process.env.WORKING_FOLDER_NAME!

const weekFileName = (weekNumber: number, year: number) => `${year}-${weekNumber}`

export const saveOrder = async (order : OrderData, customerSlug: string, weekNumber: number, year: number): Promise<void> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)

    order.slug = customerSlug

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

export const getOrderCustomers = async (weekNumber: number, year: number): Promise<OrderCustomer[]> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, workingFolderName)
    const weekFolder = await getOrCreateFolder(service, weekFileName(weekNumber, year), workingFolder.id!)

    const dataFileContent = JSON.parse(await getDataFileContent()) as SalesCycle

    const customersBySlug = {} as {[slug: string]: CustomerData}
    dataFileContent.customers.forEach(customer => customersBySlug[customer.slug] = customer)

    const orders = await getOrdersInFolder(service, weekFolder.id!)
    return orders.map(order =>  ({ order, customer: customersBySlug[order.slug] }))
}