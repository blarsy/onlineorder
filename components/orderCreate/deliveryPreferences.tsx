import { Typography } from "@mui/material"
import { Box } from "@mui/system"
import { deliveryPrefsToString, displayDeliveryDayPrefs, OrderData } from "../../lib/common"

interface Props {
    order: OrderData
}

const DeliveryPreferences = ({ order }: Props) => {
    return <Box>
        <Typography>
            {deliveryPrefsToString(order.preferredDeliveryTimes)}
        </Typography>
    </Box>
}

export default DeliveryPreferences