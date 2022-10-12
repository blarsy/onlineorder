import { setLocale } from 'yup'
import { CustomerData } from '../../../lib/common'
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
