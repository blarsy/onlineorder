import { Box, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import { useState, useEffect } from 'react'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import CollapseIcon from '@mui/icons-material/ExpandLess'
import { ConnectionData, OrderCustomer, OrderStatus, orderFromApiCallResult } from '../../lib/common'
import Loader from "../form/loader"
import { extractUiError, getOrderTotal } from '../../lib/form/formCommon'
import { EnrichedSalesCycle, getData } from '../../lib/form/salesCycleCache'
import OrderDetails from './orderDetails'
import OrderActions from './orderActions'

const getStatusLabel = (status: OrderStatus): string => {
    switch(status){
        case OrderStatus.draft:
            return 'Brouillon'
        case OrderStatus.confirmed:
            return 'Confirmée'
        default:
            return '?'
    }
}

interface Props {
    connectionData: ConnectionData
}

const OrdersFollowup = ({ connectionData }: Props) => {
    const [ordersState, setOrdersState] = useState({ loading: false, error: '', data: [] as OrderCustomer[], enrichedSalesCycle: null as EnrichedSalesCycle | null })
    const [expanded, setExpanded] = useState(null as string | null)
    useEffect(() => {
        const load = async () => {
            try {
                setOrdersState({ loading: true, error: '', data: ordersState.data, enrichedSalesCycle: ordersState.enrichedSalesCycle })
                const enrichedSalesCycle = await getData()
                const res = await axios.get(`/api/order?deadline=${enrichedSalesCycle.salesCycle.deadline.toISOString()}`)
                setOrdersState({ loading: false, error: '', data: res.data, enrichedSalesCycle })
            } catch(e: any) {
                setOrdersState({ loading: false, error: extractUiError(e), data: ordersState.data, enrichedSalesCycle: ordersState.enrichedSalesCycle})
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <Loader error={ordersState.error} loading={ordersState.loading}>
        <Box display="flex" flexDirection="row" flexWrap="wrap" alignSelf="stretch">
            <Box sx={{ flex: '0 0 5%' }} />
            <Typography sx={{ flex: '0 0 20%' }} variant="overline">Date confirmation</Typography>
            <Typography sx={{ flex: '0 0 10%' }} variant="overline"># produits</Typography>
            <Typography sx={{ flex: '0 0 30%' }} variant="overline">Client</Typography>
            <Typography sx={{ flex: '0 0 10%' }} variant="overline">Statut</Typography>
            <Typography textAlign="right" sx={{ flex: '0 0 10%' }} variant="overline">Total Htva</Typography>
            <Typography textAlign="right" sx={{ flex: '0 0 15%' }} variant="overline">Actions</Typography>
            {ordersState.data.length === 0 && <Typography sx={{ flex: '0 0 100%' }} textAlign="center" variant="h6">Aucune commande pour le moment.</Typography>}
            {ordersState.data.map((orderCustomer, idx) => {
                const order = orderFromApiCallResult(orderCustomer.order)
                const confirmationDate = order.confirmationDateTime ? new Date(order.confirmationDateTime) : null
                const confirmationDateLabel = confirmationDate ? `${confirmationDate.toLocaleDateString()} ${confirmationDate.toLocaleTimeString()}` : '-'
                const orderContent = [
                    <Box key={`${idx}-1`} sx={{ flex: '0 0 5%' }}>
                        <IconButton size="small" onClick={() => {
                            if(expanded == order.slug) {
                                setExpanded(null)
                            } else {
                                setExpanded(order.slug)
                            }
                        }}>{expanded == order.slug ? <CollapseIcon /> : <ExpandIcon />}</IconButton>
                    </Box>,
                    <Typography key={`${idx}-2`} sx={{ flex: '0 0 20%' }} variant="body1">{confirmationDateLabel}</Typography>,
                    <Typography key={`${idx}-3`} sx={{ flex: '0 0 10%' }} variant="body1">{order.quantities.length + order.quantitiesNonLocal.length}</Typography>,
                    <Typography key={`${idx}-4`} sx={{ flex: '0 0 30%' }} variant="body1">{orderCustomer.customer.customerName}</Typography>,
                    <Typography key={`${idx}-5`} sx={{ flex: '0 0 10%' }} variant="body1">{getStatusLabel(order.status)}</Typography>,
                    <Typography key={`${idx}-6`} textAlign="right" sx={{ flex: '0 0 10%' }} variant="body1">{getOrderTotal(order, ordersState.enrichedSalesCycle!).totalHtva.toFixed(2)}€</Typography>,
                    <Box key={`${idx}-7`} sx={{ flex: '0 0 15%' }} display="flex" justifyContent="flex-end" flexGrow="1"><OrderActions orderCustomer={orderCustomer} connectionData={connectionData}/></Box>]
                if(expanded && expanded == order.slug) {
                    orderContent.push(<OrderDetails key={`${idx}-8`} order={order} enrichedSalesCycle={ordersState.enrichedSalesCycle!} />)
                }

                return orderContent
            })}
        </Box>
    </Loader>
}

export default OrdersFollowup