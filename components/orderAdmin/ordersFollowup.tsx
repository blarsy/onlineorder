import { Box, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import { useState, useEffect } from 'react'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import CollapseIcon from '@mui/icons-material/ExpandLess'
import { OrderCustomer, OrderStatus } from '../../lib/common'
import Loader from "../form/loader"
import { getOrderTotal } from '../../lib/formCommon'
import { EnrichedSalesCycle, getData } from '../../lib/salesCycleCache'
import OrderDetails from './orderDetails'

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

const OrdersFollowup = () => {
    const [ordersState, setOrdersState] = useState({ loading: false, error: '', data: [] as OrderCustomer[], enrichedSalesCycle: null as EnrichedSalesCycle | null })
    const [expanded, setExpanded] = useState(null as string | null)
    useEffect(() => {
        const load = async () => {
            try {
                setOrdersState({ loading: true, error: '', data: ordersState.data, enrichedSalesCycle: ordersState.enrichedSalesCycle })
                const enrichedSalesCycle = await getData()
                const targetWeek = enrichedSalesCycle.salesCycle.targetWeek
                const res = await axios.get(`/api/order?weeknumber=${targetWeek.weekNumber}&year=${targetWeek.year}`)
                setOrdersState({ loading: false, error: '', data: res.data, enrichedSalesCycle })
            } catch(e: any) {
                setOrdersState({ loading: false, error: e.toString(), data: ordersState.data, enrichedSalesCycle: ordersState.enrichedSalesCycle})
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <Loader error={ordersState.error} loading={ordersState.loading} initial={false}>
        <Box display="flex" flexDirection="row" flexWrap="wrap" alignSelf="stretch">
            <Box sx={{ flex: '0 0 10%' }} />
            <Typography sx={{ flex: '0 0 25%' }} variant="overline">Date confirmation</Typography>
            <Typography sx={{ flex: '0 0 10%' }} variant="overline"># produits</Typography>
            <Typography sx={{ flex: '0 0 35%' }} variant="overline">Client</Typography>
            <Typography sx={{ flex: '0 0 10%' }} variant="overline">Statut</Typography>
            <Typography textAlign="right" sx={{ flex: '0 0 10%' }} variant="overline">Total Htva</Typography>
            {ordersState.data.length === 0 && <Typography sx={{ flex: '0 0 100%' }} textAlign="center" variant="h6">Aucune commande pour le moment.</Typography>}
            {ordersState.data.map((orderCustomer, idx) => {
                const confirmationDate = orderCustomer.order.confirmationDateTime ? new Date(orderCustomer.order.confirmationDateTime) : null
                const confirmationDateLabel = confirmationDate ? `${confirmationDate.toLocaleDateString()} ${confirmationDate.toLocaleTimeString()}` : '-'
                const orderContent = [
                    <Box key={`${idx}-1`} sx={{ flex: '0 0 10%' }}>
                        <IconButton size="small" onClick={() => {
                            if(expanded == orderCustomer.order.slug) {
                                setExpanded(null)
                            } else {
                                setExpanded(orderCustomer.order.slug)
                            }
                        }}>{expanded == orderCustomer.order.slug ? <CollapseIcon /> : <ExpandIcon />}</IconButton>
                    </Box>,
                    <Typography key={`${idx}-2`} sx={{ flex: '0 0 25%' }} variant="body1">{confirmationDateLabel}</Typography>,
                    <Typography key={`${idx}-3`} sx={{ flex: '0 0 10%' }} variant="body1">{orderCustomer.order.quantities.length + orderCustomer.order.quantitiesNonLocal.length}</Typography>,
                    <Typography key={`${idx}-4`} sx={{ flex: '0 0 35%' }} variant="body1">{orderCustomer.customer.customerName}</Typography>,
                    <Typography key={`${idx}-5`} sx={{ flex: '0 0 10%' }} variant="body1">{getStatusLabel(orderCustomer.order.status)}</Typography>,
                    <Typography key={`${idx}-6`} textAlign="right" sx={{ flex: '0 0 10%' }} variant="body1">{getOrderTotal(orderCustomer.order, ordersState.enrichedSalesCycle!).totalHtva.toFixed(2)}€</Typography>]
                if(expanded && expanded == orderCustomer.order.slug) {
                    orderContent.push(<OrderDetails key={`${idx}-7`} order={orderCustomer.order} enrichedSalesCycle={ordersState.enrichedSalesCycle!} />)
                }

                return orderContent
            })}
        </Box>
    </Loader>
}

export default OrdersFollowup