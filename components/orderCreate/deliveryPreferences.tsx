import { Typography } from "@mui/material"
import { Box } from "@mui/system"
import { DeliveryTime, DeliveryTimes, OrderData } from "../../lib/common"
import { easyDate, getDeliveryTimeLabel } from "../../lib/formCommon"

interface Props {
    order: OrderData
}

const displayDeliveryDayPrefs = (deliveryDate: DeliveryTime) => {
        if(deliveryDate.times.some(time => time.checked)) {
            const timeLabels = deliveryDate.times.filter(time => time.checked).map(time => getDeliveryTimeLabel(time.deliveryTime))
            return `${easyDate(deliveryDate.day)} ${timeLabels.join(', ')}  `
        } else {
            return ''
        }
    }

const DeliveryPreferences = ({ order }: Props) => {
    return <Box>
        <Typography>Préférences livraison:&nbsp;
            { order.preferredDeliveryTimes.map(deliveryDay => <span key={deliveryDay.day.valueOf()}>{displayDeliveryDayPrefs(deliveryDay)}</span>)}
        </Typography>
    </Box>
}

export default DeliveryPreferences