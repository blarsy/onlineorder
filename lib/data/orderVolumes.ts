import { OrderData, OrderedVolumes } from "../common"

export const handleOrderedVolumes = (order: OrderData, orderedVolumes: OrderedVolumes, customerSlug: string): OrderedVolumes => {
    order.quantities.forEach(product => {
        const quantitiesOrdered = orderedVolumes[product.productId].orders.reduce<number>((acc, orderQuantity) => acc += orderQuantity.quantityOrdered, 0)
        if(quantitiesOrdered + product.quantity > orderedVolumes[product.productId].originalQuantity) {
            throw new Error('Some products are out of stock')
        }
        orderedVolumes[product.productId].orders.push({ customerSlug, quantityOrdered: product.quantity })
    })
    return orderedVolumes
}
