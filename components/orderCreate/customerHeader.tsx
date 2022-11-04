import { Stack, Box, Typography } from "@mui/material"
import { CustomerData, SalesCycle } from "../../lib/common"
import { getWeek, getWeekBounds } from "../../lib/dateWeek"
import { easyDateTime } from "../../lib/formCommon"

interface Props {
    customer: CustomerData,
    salesCycle: SalesCycle
}
const CustomerHeader = ({ customer, salesCycle } : Props) => {
    const weekBounds = getWeekBounds(salesCycle.deliveryDate)
    return <Stack direction="row" alignSelf="center">
        <Box sx={{width: '5rem', height:'5rem'}}><img alt="Logo de la Coopérative alimentaire" src='/Logo-header.png' width="100%" height="100%"/></Box>
        <Box>
            <Typography variant="h4" align="center">{customer.customerName}</Typography>
            <Typography variant="h5" align="center">Commande semaine {`${getWeek(salesCycle.deliveryDate)}-${salesCycle.deliveryDate.getFullYear()}  ${weekBounds[0].toLocaleDateString('fr-BE')} - ${weekBounds[1].toLocaleDateString('fr-BE')}`}</Typography>
            <Typography variant="overline" align="center">Clôture: {easyDateTime(salesCycle.deadline)}</Typography>
        </Box>
    </Stack>
}

export default CustomerHeader