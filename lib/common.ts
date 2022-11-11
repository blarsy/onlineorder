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
    confirmed = 'Confirmed',
    tooLate = 'tooLate'
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
    preferredDeliveryTimes: DeliveryTime[],
    note: string,
    confirmationDateTime?: Date
}

export interface DeliveryTime {
    day: Date,
    times: {
        deliveryTime: DeliveryTimes,
        checked: boolean
    }[]
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
    deliveryDate: Date,
    creationDate: Date,
    deadline: Date,
    availableDeliveryTimes: AvailableDeliveryTime[],
}

export interface AvailableDeliveryTime {
    day: Date,
    times: DeliveryTimes[]
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

export const errorToString = (error: any): string => {
    console.log(error)
    if(error instanceof Error) {
        let message = error.message
        if(typeof(error.message) === 'object'){
            message = JSON.stringify(message)
        }
        return `message: ${message}, stack: ${error.stack}`
    } else if(typeof(error) === 'object') {
        return JSON.stringify(error)
    } else {
        return error.toString()
    }
}

export enum TaskStatus {
    created,
    executing,
    finished
}

export interface TaskLogEntry {
    date: Date,
    name: string,
    status: TaskStatus,
    error?: string
}