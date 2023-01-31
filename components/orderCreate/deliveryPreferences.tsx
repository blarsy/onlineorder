import { Stack, Typography } from "@mui/material"
import { Box } from "@mui/system"
import { deliveryPrefsToString, displayDeliveryDayPrefs, OrderData, SalesCycle } from "../../lib/common"

interface Props {
    salesCycle: SalesCycle
    order: OrderData
}

const DeliveryPreferences = ({ order, salesCycle }: Props) => {
    return <Box>
        <Typography variant="overline"> Préférences livraison :</Typography>
        {order.preferredDeliveryTimes.map((pdt, idx) => <Stack key={idx}>
            <Typography>{salesCycle.deliverySchemes[pdt.deliverySchemeIndex].productCategories.join(', ')}</Typography>
            <Typography>{deliveryPrefsToString(pdt.prefs)}</Typography>
        </Stack>)}
    </Box>
}

export default DeliveryPreferences