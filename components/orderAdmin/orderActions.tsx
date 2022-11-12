import { LoadingButton } from '@mui/lab'
import { useState } from 'react'
import axios from "axios"
import { ConnectionData, OrderCustomer } from "../../lib/common"
import { Box } from '@mui/material'
import TaskError from './taskError'

interface Props {
    orderCustomer: OrderCustomer,
    connectionData: ConnectionData
}

const OrderActions = ({ orderCustomer, connectionData } : Props) => {
    const [status, setStatus] = useState({loading: false, error: ''})
    return <Box display="flex">
        { !orderCustomer.order.id && <LoadingButton loading={status.loading} variant="outlined" onClick={async () => {
            try {
                setStatus({ loading: true, error: '' })
                const message = new Date().toUTCString()
                const signature = await connectionData.signer?.signMessage(message)

                const res = await axios.patch('/api/order', { message, signature, slug: orderCustomer.customer.slug })
                orderCustomer.order.id = Number(res.data)
                setStatus({ loading: false, error: '' })
            } catch (e: any) {
                setStatus({ loading: false, error: e.toString() })
            }
            
        }}>Créer</LoadingButton>}
        { status.error && <TaskError error={status.error} />}
        { orderCustomer.order.id && `Odoo cmd ${orderCustomer.order.id}`}
    </Box>
}

export default OrderActions