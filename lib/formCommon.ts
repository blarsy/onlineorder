import { setLocale } from 'yup'
import { CustomerData, DeliveryTimes, OrderData } from './common'
import { EnrichedSalesCycle } from './salesCycleCache'

export const VATFOOD = 0.06

setLocale({
    mixed: {
      required: 'Obligatoire',
      notType: 'Type incorrect'
    },
    number: {
        max: ({max}) => `Maximum ${max}`,
        min: ({min}) => `Minimum ${min}`
    }
  })

  export interface OrderStepProps {
    enrichedSalesCycle: EnrichedSalesCycle,
    customer: CustomerData,
    next?: () => void,
    prev?: () => void,
    mutateCustomer?: (customer: CustomerData) => void,
    save: ( customer: CustomerData, delivery: Date) => Promise<string>
}

export interface OrderPrefs {
  [preferredDeliveryTimeId: string]: boolean,
}

export const getDeliveryTimeLabel = (deliveryTime : DeliveryTimes) => `${deliveryTime}-${Number(deliveryTime)+1}`

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
const week = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
export const easyDate = (date: Date) => `${week[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`

export const makePrefCtrlId = (day: Date, deliveryTime: DeliveryTimes) => `${day.valueOf()}-${deliveryTime.toString()}`

export const easyDateTime = (date: Date) => `${week[date.getDay()]} ${zeroPad(date.getDate(), 2)}/${zeroPad((date.getMonth() + 1), 2)} ${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}`

export interface ProductsQuantities {
  [id: string]: number
}

export const getOrderTotal = (order: OrderData, enrichedSalesCycle: EnrichedSalesCycle):{ totalHtva: number, tva: number } => {
  const totalProductsHtva = order.quantities.reduce<number>((acc, quantity) => {
      const productInfo = enrichedSalesCycle.productsById[quantity.productId] 
      return acc += productInfo.product.price * Number(quantity.quantity)
  }, 0)
  const totalNonLocalProductsHtva  = order.quantitiesNonLocal.reduce<number>((acc, quantity) => {
      const product = enrichedSalesCycle.nonLocalProductsById[quantity.productId] 
      return acc += product.price * Number(quantity.quantity) * Number(product.packaging)
  }, 0)
  const totalHtva = totalProductsHtva + totalNonLocalProductsHtva
  return { totalHtva, tva: totalHtva * VATFOOD }
}

export const orderFromApiCallResult = (orderFromApi: OrderData): OrderData => {
  // dates come as ISO strings from Api, but we want them typed as Dates
  orderFromApi.preferredDeliveryTimes.forEach(dayPrefs => dayPrefs.day = new Date(dayPrefs.day))
  return orderFromApi
}