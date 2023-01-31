import { LoadingButton } from '@mui/lab'
import { useState } from 'react'
import axios from "axios"
import { ConnectionData, OrderCustomer } from "../../lib/common"
import { Box } from '@mui/material'
import TaskError from './taskError'
import { extractUiError } from '../../lib/form/formCommon'

interface Props {
    orderCustomer: OrderCustomer,
    connectionData: ConnectionData
}

const OrderActions = ({ orderCustomer, connectionData } : Props) => {
    const [status, setStatus] = useState({loading: false, error: ''})
    return <Box display="flex">
        { !orderCustomer.order.ids && <LoadingButton loading={status.loading} variant="outlined" onClick={async () => {
            try {
                setStatus({ loading: true, error: '' })
                const message = new Date().toUTCString()
                const signature = await connectionData.signer?.signMessage(message)

                const res = await axios.patch('/api/order', { message, signature, slug: orderCustomer.customer.slug })
                orderCustomer.order.ids = res.data.orderIds
                setStatus({ loading: false, error: '' })
            } catch (e: any) {
                setStatus({ loading: false, error: extractUiError(e) })
            }
            
        }}>Créer</LoadingButton>}
        { status.error && <TaskError error={status.error} />}
        { orderCustomer.order.ids && `Odoo cmd ${orderCustomer.order.ids.join(', ')}`}
    </Box>
}

export default OrderActions