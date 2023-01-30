import { Stack, Box, Typography } from "@mui/material"
import { CustomerData, SalesCycle, easyDateTime } from "../../lib/common"
import { getWeek, getWeekBounds } from "../../lib/dateWeek"

interface Props {
    customer: CustomerData,
    salesCycle: SalesCycle
}
const CustomerHeader = ({ customer, salesCycle } : Props) => {
    return <Stack direction="row" alignSelf="center" alignItems="center">
        <Box sx={{width: '5rem', height:'5rem', flexShrink: 0}}><img alt="Logo de la Coopérative alimentaire" src='/Logo-header.png' width="100%" height="100%"/></Box>
        <Box>
            <Typography variant="h4" align="center">{customer.customerName}</Typography>
            <Typography variant="h5" align="center">Commande à clôturer avant le {easyDateTime(salesCycle.deadline)}</Typography>
        </Box>
    </Stack>
}

export default CustomerHeader