import { useState } from "react"
import { Box, Stack, Typography } from "@mui/material"
import { CustomerData, OrderData } from "../../lib/common"
import { getWeekBounds, getWeek, addDays, getDateOfISOWeek } from "../../lib/dateWeek"
import { EnrichedSalesCycle } from "../../lib/salesCycleCache"
import './form/common'
import EditOrderLines from "./editOrderLines"
import EditPreferences from "./editPreferences"
import ReviewSendOrder from "./reviewSendOrder"

interface Props {
    customer: CustomerData,
    enrichedSalesCycle: EnrichedSalesCycle
}

const EditOrder = ({customer, enrichedSalesCycle} : Props) => {
    const [step, setStep] = useState(0)
    const next = () => { setStep(step + 1) }
    const prev = () => { setStep(step - 1) }

    const weekBounds = getWeekBounds(getDateOfISOWeek(enrichedSalesCycle.salesCycle.targetWeek.weekNumber, enrichedSalesCycle.salesCycle.targetWeek.year))

    return <Stack alignItems="center" direction="column" justifyContent="flex-begin">
        <Stack direction="row">
            <Box sx={{width: '5rem', height:'5rem'}}><img src='/Logo-header.png' width="100%" height="100%"/></Box>
            <Box>
                <Typography variant="h4" align="center">{customer.customerName}</Typography>
                <Typography variant="h5" align="center">Commande semaine {`${enrichedSalesCycle.salesCycle.targetWeek.weekNumber}-${enrichedSalesCycle.salesCycle.targetWeek.year}  ${weekBounds[0].toLocaleDateString('fr-BE')} - ${weekBounds[1].toLocaleDateString('fr-BE')}`}</Typography>
            </Box>
        </Stack>
        { step === 0 && <EditOrderLines enrichedSalesCycle={enrichedSalesCycle} customer={customer} next={next}/>}
        { step === 1 && <EditPreferences enrichedSalesCycle={enrichedSalesCycle} customer={customer} next={next} prev={prev} />}
        { step === 2 && <ReviewSendOrder enrichedSalesCycle={enrichedSalesCycle} customer={customer} prev={prev} />}
    </Stack>
}

export default EditOrder
