import { Stack, Typography } from "@mui/material"
import { CustomerData } from "../../lib/common"

interface Props {
    customer: CustomerData
}

const EditOrder = ({customer} : Props) => {
    return <Stack alignItems="center">
        <Typography variant="h4">{customer.customerName}</Typography>
        
    </Stack>
}

export default EditOrder