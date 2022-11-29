import { useState } from "react"
import { Stack } from "@mui/material"
import { CustomerData } from "../../lib/common"
import { EnrichedSalesCycle } from "../../lib/form/salesCycleCache"
import '../../lib/form/formCommon'
import EditOrderLines from "./editOrderLines"
import EditPreferences from "./editPreferences"
import ReviewSendOrder from "./reviewSendOrder"
import axios from "axios"
import { orderFromApiCallResult } from "../../lib/common"
import { extractUiError } from "../../lib/form/formCommon"

interface Props {
    customer: CustomerData,
    enrichedSalesCycle: EnrichedSalesCycle,
    mutateCustomer: (customer: CustomerData) => void,
    refreshQuantities: () => void
}

const EditOrder = ({customer, enrichedSalesCycle, mutateCustomer, refreshQuantities} : Props) => {
    const [step, setStep] = useState(0)
    const next = () => { setStep(step + 1) }
    const prev = () => { setStep(step - 1) }
    const prevWithQuantitiesRefresh = async () => {
        prev()
        await refreshQuantities()
    }

    const saveOrder = async ( customer: CustomerData, delivery: Date) : Promise<string> => {
        try {
            const res = await axios.put('/api/order', {
                slug: customer.slug,
                delivery,
                order: customer.order
            })
            // The server might have updated the order status (indicating that the order was confirmed too late)
            // So, we need to mutate the state with this new order data to be able to handle that case
            mutateCustomer({ ...customer, ...{ order: orderFromApiCallResult(res.data) } })
            return ''
        } catch(e: any ) {
            return `La sauvegarde de la commande a échoué: ${extractUiError(e)}`
        }
    }

    return <Stack alignItems="center" direction="column" justifyContent="flex-begin">
        { step === 0 && <EditPreferences enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} next={next} />}
        { step === 1 && <EditOrderLines enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} next={next}  prev={prevWithQuantitiesRefresh}/>}
        { step === 2 && <ReviewSendOrder enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} prev={prev} mutateCustomer={mutateCustomer} />}
    </Stack>
}

export default EditOrder
