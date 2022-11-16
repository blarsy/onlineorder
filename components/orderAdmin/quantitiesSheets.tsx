import { Box } from '@mui/material'
import { ConnectionData } from "../../lib/common"
import CreateQuantitiesSheets from './createQuantitiesSheet'
import UpdateQuantitiesSheets from './updateQuantitiesSheet'

interface Props {
    connectionData: ConnectionData
}
const QuantitiesSheets = ({ connectionData } : Props) => {

    return <Box display="flex" flexDirection="column" gap="1rem" alignItems="stretch">
        <CreateQuantitiesSheets connectionData={connectionData} />
        <UpdateQuantitiesSheets connectionData={connectionData} />
    </Box>
}

export default QuantitiesSheets