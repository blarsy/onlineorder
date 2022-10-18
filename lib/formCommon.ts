import { setLocale } from 'yup'
import { CustomerData, DeliveryTimes } from './common'
import { EnrichedSalesCycle } from './salesCycleCache'
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
    save: ( customer: CustomerData, targetWeek: {
      weekNumber: number,
      year: number
  }) => Promise<string>
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