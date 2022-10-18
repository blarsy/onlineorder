import axios from 'axios'
import { SalesCycle, ProductData, NonLocalProductData, OrderedVolumes } from './common'

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

let data = null as EnrichedSalesCycle | null

export const getData = async (): Promise<EnrichedSalesCycle> => {
    if(!data) {
        const res= await axios.get('/api/orderweek')
        if(res.status === 200){
            const salesCycle = res.data as SalesCycle
            // Comes as a valid ISO string, but still only a string, so cheap trick: convert it here
            salesCycle.creationDate = new Date(salesCycle.creationDate)
            salesCycle.deadline = new Date(salesCycle.deadline)
    
            data = enrichSalesCycle(salesCycle)
        } else {
            throw new Error(`Request failed with status ${res.status} : ${res.statusText}`)
        }
    }

    // update the quantities by subtracting the already ordered volumes
    const res = await axios.get('/api/orderedvolumes')
    if(res.status === 200) {
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

    } else {
        throw new Error(`Request for ordered volumes with status ${res.status} : ${res.statusText}`)
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
    salesCycle.products.forEach(product => {
        if(productsByCategory[product.category]){
            productsByCategory[product.category].push(product.id)
        } else {
            productsByCategory[product.category] = [product.id]
        }
        productsById[product.id] = { product, updatedQuantity: 0 }
    })

    const nonLocalProductsById = {} as NonLocalProductsById
    const nonLocalProductsByCategory = {} as NonLocalProductsByCategory

    salesCycle.nonLocalProducts.forEach(product => {
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
