import { ethers } from "ethers";

export interface ConnectionData {
    walletAddress: string,
    signer: ethers.providers.JsonRpcSigner | null
}

export interface ProductData {
    name: string, 
    category: string,
    quantity: number, 
    price: number, 
    unit: string,
    quantityPerSmallCrate?: number,
    quantityPerBigCrate?: number
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
    status: OrderStatus,
    quantities: {
        quantity: number,
        productName: string,
        unit: string,
        category: string,
        price: number
    }[],
    preferredDeliveryTimes: {
        day: Date,
        times: DeliveryTimes[]
    }[],
    note: string
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
    customers: CustomerData[],
    targetWeek: {
        weekNumber: number,
        year: number
    },
    creationDate: Date
}