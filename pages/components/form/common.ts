import { setLocale } from 'yup'
import { CustomerData, DeliveryTimes } from '../../../lib/common'
import { EnrichedSalesCycle } from '../../../lib/salesCycleCache'
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
    next?: () => void
    prev?: () => void
}

export interface OrderPrefs {
  [preferredDeliveryTimeId: string]: boolean,
}

export const makePrefCtrlId = (day: Date, deliveryTime: DeliveryTimes) => `${day.toLocaleDateString('fr-BE')}-${deliveryTime.toString()}`
