import { OrderCustomer, OrderData, OrderStatus, SalesCycle, CustomerData } from "../common";
import { getDataFileContent } from "./dataFile";
import { connectDrive, createOrReplaceOrderFile, getOrCreateFolder, getWorkingFolder, getFileContent, getFileId, getOrdersInFolder } from "./google"
import { registerOrderQuantities } from "./volumesFile"
import config from '../serverConfig'
import { drive_v3 } from "googleapis";

const getCampaignFolderId = async(campaignId: string) : Promise<[string, drive_v3.Drive]> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const weekFolder = await getOrCreateFolder(service, campaignId, workingFolder.id!)
    return [weekFolder.id!, service]
}

export const saveOrder = async (order : OrderData, customerSlug: string, campaignId: string): Promise<OrderData> => {
    const fileContentPromise = getDataFileContent()
    const campaignFolderPromise = getCampaignFolderId(campaignId)

    order.slug = customerSlug

    if(order && order.status === OrderStatus.confirmed && !order.confirmationDateTime) {
        const confirmationTime = new Date()
        order.confirmationDateTime = confirmationTime
        const salesCycle = await fileContentPromise
        if(new Date(salesCycle.deadline) < confirmationTime) {
            order.status = OrderStatus.tooLate
        }
        await registerOrderQuantities(order, customerSlug)
    }
    const [campaignFolderId, service] = await campaignFolderPromise

    await createOrReplaceOrderFile(service, customerSlug, campaignFolderId, order!)
    return order
}

export const getOrder = async (campaignId: string, slug: string): Promise<{order: OrderData, fileId: string} | null> => {
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const campaignFolder = await getOrCreateFolder(service, campaignId, workingFolder.id!)
    const fileId = await getFileId(service, slug + '.json', campaignFolder.id!)
    if(fileId){
        const fileContent = await getFileContent(service, fileId)
        if(!fileContent){
            throw new Error('No campaign found')
        }
        return {order: JSON.parse(fileContent) as OrderData, fileId}
    }
    return null
}

export const getOrderCustomers = async (campaignId: string): Promise<OrderCustomer[]> => {
    const fileContentPromise = getDataFileContent()
    const service = await connectDrive()
    const workingFolder = await getWorkingFolder(service, config.workingFolderName)
    const campaignFolder = await getOrCreateFolder(service, campaignId, workingFolder.id!)
    const ordersPromise = getOrdersInFolder(service, campaignFolder.id!)

    const salesCycle = await fileContentPromise

    const customersBySlug = {} as {[slug: string]: CustomerData}
    salesCycle.customers.forEach(customer => customersBySlug[customer.slug] = customer)

    const orders = await ordersPromise
    return orders.map(order =>  ({ order, customer: customersBySlug[order.slug] }))
}