import { AxiosError } from 'axios'
import { setLocale } from 'yup'
import { CustomerData, DeliveryTimes, OrderData } from '../common'
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
    save: ( customer: CustomerData, deadline: Date) => Promise<string>
}

export interface DeliveryPrefs {
  [preferredDeliveryTimeId: string]: boolean,
}

export interface ProductsQuantities {
  [id: string]: number
}

export const getOrderTotal = (order: OrderData, enrichedSalesCycle: EnrichedSalesCycle):{ totalHtva: number, tva: number } => {
  const totalProductsHtva = order.quantities.reduce<number>((acc, quantity) => {
      const productInfo = enrichedSalesCycle.productsById[quantity.productId] 
      return acc += productInfo ? productInfo.product.price * Number(quantity.quantity): 0
  }, 0)
  const totalNonLocalProductsHtva  = order.quantitiesNonLocal.reduce<number>((acc, quantity) => {
      const product = enrichedSalesCycle.nonLocalProductsById[quantity.productId] 
      return acc += product.price * Number(quantity.quantity) * Number(product.packaging)
  }, 0)
  const totalHtva = totalProductsHtva + totalNonLocalProductsHtva
  return { totalHtva, tva: totalHtva * VATFOOD }
}

export const TaskNames = {
  CreateCampaign: 'Creation d\'une nouvelle campagne',
  CreateQuantitiesSheet: 'Création d\'un tableau de quantités',
  UpdateQuantitiesSheet: 'Mise à jour du tableau de quantité',
  UpdateCustomers: 'Mise à jour clients',
  UpdateProducts: 'Mise à jour produits'
}

export const extractUiError = (e: any): string => {
  if(e as AxiosError) {
      const res = (e as AxiosError).response!
      if(res){
        const resData = res.data
        if (resData) {
          const errorProp = (resData as {error: string}).error
          if(errorProp) {
            return errorProp
          } else {
            return `Erreur serveur: code ${res.status}, status: ${res.statusText}, data: ${res.data}`
          }
        }
      } else {
        return (e as AxiosError).message
      }
  }
  return e.toString()
}