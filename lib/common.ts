import { ethers } from "ethers";

export interface ConnectionData {
    walletAddress: string,
    signer: ethers.providers.JsonRpcSigner | null
}

export interface ProductData {
    id: number,
    name: string, 
    category: string,
    quantity: number, 
    price: number, 
    unit: string,
    quantityPerSmallCrate?: number,
    quantityPerBigCrate?: number
}

export interface NonLocalProductData {
    id: number,
    name: string, 
    category: string,
    price: number, 
    unit: string,
    packaging: number
}

export enum OrderStatus {
    draft = 'Draft',
    confirmed = 'Confirmed'
}

export enum DeliveryTimes {
    h8 = 8,
    h9 = 9,
    h10 = 10,
    h11 = 11,
    h12 = 12,
    h13 = 13,
    h14 = 14,
    h15 = 15,
    h16 = 16
}

export interface OrderData {
    slug: string,
    status: OrderStatus,
    quantities: {
        productId: number,
        quantity: number
    }[],
    quantitiesNonLocal: {
        productId: number,
        quantity: number
    }[],
    preferredDeliveryTimes: {
        day: Date,
        times: {
            deliveryTime: DeliveryTimes,
            checked: boolean
        }[]
    }[],
    note: string,
    confirmationDateTime?: Date
}

export interface CustomerData {
    title: string,
    email: string,
    mobileNumber: string,
    slug: string,
    customerName: string,
    order?: OrderData
}

export interface SalesCycle {
    products: ProductData[],
    nonLocalProducts: NonLocalProductData[],
    customers: CustomerData[],
    targetWeek: {
        weekNumber: number,
        year: number
    },
    creationDate: Date,
    deadline: Date
}

export interface OrderedVolumes {
    [productId: number]: {
        orders: {
            customerSlug: string,
            quantityOrdered: number
        }[],
        originalQuantity: number
    }
}

export interface OrderCustomer {
    order: OrderData,
    customer: CustomerData
}