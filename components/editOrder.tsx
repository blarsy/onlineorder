import { useState } from "react"
import { Stack } from "@mui/material"
import { CustomerData } from "../lib/common"
import { EnrichedSalesCycle } from "../lib/salesCycleCache"
import '../lib/formCommon'
import EditOrderLines from "./editOrderLines"
import EditPreferences from "./editPreferences"
import ReviewSendOrder from "./reviewSendOrder"
import axios from "axios"

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

    const saveOrder = async ( customer: CustomerData, targetWeek: {
        weekNumber: number,
        year: number
    }) : Promise<string> => {
        const res = await axios.put('/api/order', {
            slug: customer.slug,
            targetWeek,
            order: customer.order
        })
        if(res.status != 200) {
            return `La sauvegarde de la commande a échoué: ${res.status} - ${res.statusText}`
        } else {
            return ''
        }
    }

    return <Stack alignItems="center" direction="column" justifyContent="flex-begin">
        { step === 0 && <EditOrderLines enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} next={next}/>}
        { step === 1 && <EditPreferences enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} next={next} prev={prevWithQuantitiesRefresh} />}
        { step === 2 && <ReviewSendOrder enrichedSalesCycle={enrichedSalesCycle} customer={customer} save={saveOrder} prev={prev} mutateCustomer={mutateCustomer} />}
    </Stack>
}

export default EditOrder
