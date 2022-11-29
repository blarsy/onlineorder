import axios from 'axios'
import { SalesCycle, ProductData, NonLocalProductData, OrderedVolumes, DeliveryTimes, AvailableDeliveryTime, restoreTypes } from '../common'
import { extractUiError } from './formCommon'

type ProductsByCategory = {
    [category: string]: number[]
}

type NonLocalProductsByCategory = {
    [category: string]: NonLocalProductData[]
}

export type ProductsById = {
    [id: number]: {
        product: ProductData,
        updatedQuantity: number
    }
}

type NonLocalProductsById = {
    [id: number]: NonLocalProductData
}

export const getData = async (): Promise<EnrichedSalesCycle> => {
    let data = null as EnrichedSalesCycle | null

    try {
        const resCampaign= await axios.get('/api/campaign')
        const salesCycle = resCampaign.data as SalesCycle
        restoreTypes(salesCycle)
        data = enrichSalesCycle(salesCycle)
            
        // update the quantities by subtracting the already ordered volumes
        try {
            const res = await axios.get('/api/orderedvolumes')
            const orderedVolumes = res.data as OrderedVolumes

            Object.keys(orderedVolumes).forEach(productIdStr => {
                const productId = Number(productIdStr)
                const volumeInfo = orderedVolumes[productId]
                if(volumeInfo.orders.length > 0) {
                    data!.productsById[productId].updatedQuantity = 
                        data!.productsById[productId].product.quantity - 
                        volumeInfo.orders.reduce<number>((acc, orderInfo) => acc += orderInfo.quantityOrdered, 0)
                } else {
                    data!.productsById[productId].updatedQuantity = 
                        data!.productsById[productId].product.quantity
                }
            })
        } catch (e: any) {
            throw new Error(extractUiError(e))
        }
    } catch (e : any) {
        const error = extractUiError(e)
        if(error.includes('No campaign found')) {
            throw new Error('Aucune campagne active pour le moment, créez-en une avant tout autre chose.')
        }
        throw new Error(error)
    }

    return data
}

export interface EnrichedSalesCycle {
    salesCycle: SalesCycle,
    productsByCategory: ProductsByCategory,
    productsById: ProductsById,
    nonLocalProductsByCategory: NonLocalProductsByCategory,
    nonLocalProductsById: NonLocalProductsById
}

const enrichSalesCycle = (salesCycle: SalesCycle): EnrichedSalesCycle => {
    const productsById = {} as ProductsById
    const productsByCategory = {} as ProductsByCategory
    salesCycle.products.sort((a, b) => a.name.localeCompare(b.name, 'fr-BE')).forEach(product => {
        if(productsByCategory[product.category]){
            productsByCategory[product.category].push(product.id)
        } else {
            productsByCategory[product.category] = [product.id]
        }
        productsById[product.id] = { product, updatedQuantity: 0 }
    })

    const nonLocalProductsById = {} as NonLocalProductsById
    const nonLocalProductsByCategory = {} as NonLocalProductsByCategory

    salesCycle.nonLocalProducts.sort((a, b) => a.name.localeCompare(b.name, 'fr-BE')).forEach(product => {
        if(nonLocalProductsByCategory[product.category]) {
            nonLocalProductsByCategory[product.category].push(product)
        } else {
            nonLocalProductsByCategory[product.category] = [product]
        }
        nonLocalProductsById[product.id] = product
    })

    return {
        salesCycle,
        productsByCategory,
        productsById,
        nonLocalProductsByCategory,
        nonLocalProductsById
    }
}
