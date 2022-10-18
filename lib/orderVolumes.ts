import { OrderData, OrderedVolumes } from "./common"

export const ordersIdentical = (order: OrderData, previousOrderVersion: OrderData | null): boolean => {
    if(!previousOrderVersion) return false
    if(order.quantities.length != previousOrderVersion.quantities.length || 
        order.quantitiesNonLocal.length != previousOrderVersion.quantitiesNonLocal.length ) {
        return false
    }
    // Search a quantity that does not have its identical in the previous version of the order
    if(order.quantities.find(quantity => {
        const previousQuantityForProduct = previousOrderVersion.quantities.find(prevQuantity => prevQuantity.productId == quantity.productId && prevQuantity.quantity == quantity.quantity)
        return !previousQuantityForProduct
    })) {
        return false
    }
    // do the same for non-local products
    if(order.quantitiesNonLocal.find(quantity => {
        const previousQuantityForProduct = previousOrderVersion.quantitiesNonLocal.find(prevQuantity => prevQuantity.productId == quantity.productId && prevQuantity.quantity == quantity.quantity)
        return !previousQuantityForProduct
    })) {
        return false
    }
    return true
}

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
