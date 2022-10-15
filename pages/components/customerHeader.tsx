import { Stack, Box, Typography } from "@mui/material"
import { CustomerData, SalesCycle } from "../../lib/common"
import { getDateOfISOWeek, getWeekBounds } from "../../lib/dateWeek"

interface Props {
    customer: CustomerData,
    salesCycle: SalesCycle
}
const CustomerHeader = ({ customer, salesCycle } : Props) => {
    const weekBounds = getWeekBounds(getDateOfISOWeek(salesCycle.targetWeek.weekNumber, salesCycle.targetWeek.year))
    return <Stack direction="row" alignSelf="center">
        <Box sx={{width: '5rem', height:'5rem'}}><img src='/Logo-header.png' width="100%" height="100%"/></Box>
        <Box>
            <Typography variant="h4" align="center">{customer.customerName}</Typography>
            <Typography variant="h5" align="center">Commande semaine {`${salesCycle.targetWeek.weekNumber}-${salesCycle.targetWeek.year}  ${weekBounds[0].toLocaleDateString('fr-BE')} - ${weekBounds[1].toLocaleDateString('fr-BE')}`}</Typography>
        </Box>
    </Stack>
}

export default CustomerHeader