import { createOrder } from './odoo'
import { getDataFileContent } from './dataFile'
import { getOrder, saveOrder } from './orderFile'
import { orderFromApiCallResult } from '../common'
export const createErpOrder = async (slug: string): Promise<number> => {
    const salesCycle = await getDataFileContent()
    const orderData = await getOrder(salesCycle.deliveryDate, slug)
    if(!orderData) {
        throw new Error('No order found.')
    }
    if(orderData.order.id) {
        throw new Error('Order already created in ERP')
    }
    const customer = salesCycle.customers.find(customer => customer.slug === slug)
    if(!customer) {
        throw new Error('Customer not found')
    }
    orderData.order= orderFromApiCallResult(orderData.order)
    const orderId = await createOrder(orderData.order, customer.id, salesCycle.products, salesCycle.nonLocalProducts)
    orderData.order.id = orderId
    await saveOrder(orderData.order, slug, salesCycle.deliveryDate)
    return orderId
}