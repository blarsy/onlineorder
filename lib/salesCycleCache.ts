import axios from 'axios'
import { SalesCycle, ProductData, NonLocalProductData } from './common'

type ProductsByCategory = {
    [category: string]: {
        product: ProductData,
        ctrlId: string
    }[]
}

type NonLocalProductsByCategory = {
    [category: string]: {
        product: NonLocalProductData,
        ctrlId: string
    }[]
}

type ProductsByCtrlId = {
    [ctrlId: string]: ProductData
}

type NonLocalProductsByCtrlId = {
    [ctrlId: string]: NonLocalProductData
}

let data = null as EnrichedSalesCycle | null

export const getData = async (): Promise<EnrichedSalesCycle> => {
    if(data) {
        return data
    }

    const res= await axios.get('/api/orderweek')
    if(res.status === 200){
        const salesCycle = res.data as SalesCycle
        // Comes as a valide ISO string, but still only a string, so cheap trick: convert it here
        salesCycle.creationDate = new Date(salesCycle.creationDate)
        salesCycle.deadline = new Date(salesCycle.deadline)

        const productsByCtrlId = {} as ProductsByCtrlId
        const productsByCategory = {} as ProductsByCategory
        salesCycle.products.forEach(product => {
            if(productsByCategory[product.category]){
                productsByCategory[product.category].push({product, ctrlId: '' })
            } else {
                productsByCategory[product.category] = [{ product, ctrlId: '' }]
            }
        })
        // Now set the ctrlIds, which is easier by looping on categories with their index available
        Object.keys(productsByCategory).forEach((category, catIdx) => {
            productsByCategory[category].forEach((productRec , prodIdx) => {
                const ctrlId = `c${catIdx}p${prodIdx}`
                productRec.ctrlId = ctrlId
                productsByCtrlId[ctrlId] = productRec.product
            })
        })

        const nonLocalProductsByCtrlId = {} as NonLocalProductsByCtrlId
        const nonLocalProductsByCategory = {} as NonLocalProductsByCategory

        salesCycle.nonLocalProducts.forEach(product => {
            if(nonLocalProductsByCategory[product.category]) {
                nonLocalProductsByCategory[product.category].push({ product, ctrlId: '' })
            } else {
                nonLocalProductsByCategory[product.category] = [{ product, ctrlId: '' }]
            }
        })
        // Now set the ctrlIds, which is easier by looping on categories with their index available
        Object.keys(nonLocalProductsByCategory).forEach((category, catIdx) => {
            nonLocalProductsByCategory[category].forEach((productRec , prodIdx) => {
                const ctrlId = `nlc${catIdx}p${prodIdx}`
                productRec.ctrlId = ctrlId
                nonLocalProductsByCtrlId[ctrlId] = productRec.product
            })
        })

        return {
            salesCycle,
            productsByCategory,
            productsByCtrlId,
            nonLocalProductsByCategory,
            nonLocalProductsByCtrlId
        }
    } else {
        throw new Error(`Request failed with status ${res.status} : ${res.statusText}`)
    }
}

export interface EnrichedSalesCycle {
    salesCycle: SalesCycle,
    productsByCategory: ProductsByCategory,
    productsByCtrlId: ProductsByCtrlId,
    nonLocalProductsByCategory: NonLocalProductsByCategory,
    nonLocalProductsByCtrlId: NonLocalProductsByCtrlId
}