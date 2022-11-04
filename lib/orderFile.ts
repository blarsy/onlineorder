import { OrderCustomer, OrderData, OrderStatus, SalesCycle, CustomerData } from "./common";
import { getDataFileContent } from "./dataFile";
import { connectDrive, createOrReplaceOrderFile, getOrCreateFolder, getWorkingFolder, getFileContent, getFileId, getOrdersInFolder } from "./google"
import { registerOrderQuantities } from "./volumesFile"
import config from './serverConfig'

export const saveOrder = async (order : OrderData, customerSlug: string, delivery: Date): Promise<OrderData> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const weekFolder = await getOrCreateFolder(service, delivery.toISOString(), workingFolder.id!)

    order.slug = customerSlug

    if(order && order.status === OrderStatus.confirmed && !order.confirmationDateTime) {
        const confirmationTime = new Date()
        order.confirmationDateTime = confirmationTime
        const salesCycle = JSON.parse(await getDataFileContent())
        if(new Date(salesCycle.deadline) < confirmationTime) {
            order.status = OrderStatus.tooLate
        }
        await registerOrderQuantities(order, customerSlug)
    }

    await createOrReplaceOrderFile(service, customerSlug, weekFolder.id!, order!)
    return order
}

export const getOrder = async (delivery: Date, slug: string): Promise<{order: OrderData, fileId: string} | null> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const weekFolder = await getOrCreateFolder(service, delivery.toISOString(), workingFolder.id!)
    const fileId = await getFileId(service, slug + '.json', weekFolder.id!)
    if(fileId){
        const fileContent = await getFileContent(service, fileId)
        return {order: JSON.parse(fileContent) as OrderData, fileId}
    }
    return null
}

export const getOrderCustomers = async (delivery: Date): Promise<OrderCustomer[]> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const weekFolder = await getOrCreateFolder(service, delivery.toISOString(), workingFolder.id!)

    const dataFileContent = JSON.parse(await getDataFileContent()) as SalesCycle

    const customersBySlug = {} as {[slug: string]: CustomerData}
    dataFileContent.customers.forEach(customer => customersBySlug[customer.slug] = customer)

    const orders = await getOrdersInFolder(service, weekFolder.id!)
    return orders.map(order =>  ({ order, customer: customersBySlug[order.slug] }))
}