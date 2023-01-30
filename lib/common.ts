import { ethers } from "ethers"

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
    id?: number,
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
    id: number,
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
    creationDate: Date,
    deadline: Date,
    deliverySchemes: DeliveryScheme[],
}

export interface DeliveryScheme {
    productCategories: string[]
    delivery: Date
    deliveryTimes: AvailableDeliveryTime[]
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

export interface InputDeliveryDate {
    productCategories: string[]
    date: string
}

export interface DeliveryDate {
    productCategories: string[]
    date: Date
}

export const restoreTypes = (salesCycle: SalesCycle) => {
    salesCycle.creationDate = new Date(salesCycle.creationDate)
    salesCycle.deadline = new Date(salesCycle.deadline)
    salesCycle.deliverySchemes = salesCycle.deliverySchemes.map(scheme => <DeliveryScheme>{
        delivery: new Date(scheme.delivery),
        productCategories: scheme.productCategories,
        deliveryTimes: scheme.deliveryTimes.map(adt => ({ 
            day: new Date(adt.day),
            times: adt.times.map(time => ensureDeliveryTime(time) )
        }))
    })
}

const ensureDeliveryTime = (value: string | DeliveryTimes): DeliveryTimes => {
    if(typeof value === 'string') {
        return Number(Object.keys(DeliveryTimes)[Object.values(DeliveryTimes).findIndex(val => val === value)]) as DeliveryTimes
    } else {
        return value as DeliveryTimes
    }
}

export const displayDeliveryDayPrefs = (deliveryDate: DeliveryTime) => {
    if(deliveryDate.times.some(time => time.checked)) {
        const timeLabels = deliveryDate.times.filter(time => time.checked).map(time => getDeliveryTimeLabel(time.deliveryTime))
        return `${easyDate(deliveryDate.day)} ${timeLabels.join(', ')}  `
    } else {
        return ''
    }
}
export const getDeliveryTimeLabel = (deliveryTime : DeliveryTimes) => `${deliveryTime}-${Number(deliveryTime)+1}`

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
export const easyDate = (date: Date) => date.toLocaleDateString('fr-BE', { day: "2-digit", weekday: "short", month: "2-digit", timeZone: 'Europe/Brussels' })
export const easyDateTime = (date: Date) => date.toLocaleDateString('fr-BE', { day: "2-digit", weekday: "short", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Brussels' })

export const deliveryPrefsToString = (deliveryTimes: DeliveryTime[]): string => {
    return `Préférences livraison :\n${deliveryTimes.map(deliveryDay => displayDeliveryDayPrefs(deliveryDay)).join('\n')}`
}

export const orderFromApiCallResult = (orderFromApi: OrderData): OrderData => {
    // dates come as ISO strings from Api, but we want them typed as Dates
    orderFromApi.preferredDeliveryTimes.forEach(dayPrefs => dayPrefs.day = new Date(dayPrefs.day))
    return orderFromApi
}
  