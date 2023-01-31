import { createOrder } from './odoo'
import { getDataFileContent } from './dataFile'
import { getOrder, saveOrder } from './orderFile'
import { orderFromApiCallResult } from '../common'
export const createErpOrder = async (slug: string): Promise<number[]> => {
    const salesCycle = await getDataFileContent()
    const orderData = await getOrder(salesCycle.deadline.toISOString(), slug)
    if(!orderData) {
        throw new Error('No order found.')
    }
    if(orderData.order.ids) {
        throw new Error('Order already created in ERP')
    }
    const customer = salesCycle.customers.find(customer => customer.slug === slug)
    if(!customer) {
        throw new Error('Customer not found')
    }
    orderData.order= orderFromApiCallResult(orderData.order)
    const orderIds = await createOrder(orderData.order, customer.id, salesCycle)
    orderData.order.ids = orderIds
    await saveOrder(orderData.order, slug, salesCycle.deadline.toISOString())
    return orderIds
}