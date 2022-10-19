import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { CustomerData, DeliveryTimes, OrderData, OrderStatus } from '../lib/common'
import { EnrichedSalesCycle, getData } from '../lib/salesCycleCache'
import EditOrder from '../components/editOrder'
import Loader from '../components/loader'
import { addDays, getDateOfISOWeek } from '../lib/dateWeek'
import { Stack, Alert } from '@mui/material'
import CustomerHeader from '../components/customerHeader'

const orderFromApiCallResult = (orderFromApi: OrderData): OrderData => {
    // dates come as ISO strings from Api, but we want them typed as Dates
    orderFromApi.preferredDeliveryTimes.forEach(dayPrefs => dayPrefs.day = new Date(dayPrefs.day))
    return orderFromApi
}

const Order = () => {
    const router = useRouter()
    const { slug } = router.query
    const [salesCycleState, setSalesCycleState] = useState({ 
        loading: true, 
        error: '', 
        enrichedSalesCycle: null as EnrichedSalesCycle | null,
        customer: null as CustomerData | null
    })

    const refreshQuantities = async () => {
        const customer = salesCycleState.customer
        setSalesCycleState({ loading: true, error: '', enrichedSalesCycle: null, customer: null })
        try{
            const enrichedSalesCycle = await getData()
            setSalesCycleState({ loading: false, error: '', enrichedSalesCycle, customer })
        } catch(e) {
            setSalesCycleState({ loading: false, error: e as string, enrichedSalesCycle: null, customer: null })
        }
    }
    
    useEffect(() => {
        const load = async () => {
            setSalesCycleState({ loading: true, error: '', enrichedSalesCycle: null, customer: null })
            try {
                const enrichedSalesCycle = await getData()
                const customer = enrichedSalesCycle.salesCycle.customers.find(customer => customer.slug === slug)
                if(!customer){
                    setSalesCycleState({ loading: false, error: `Ce numéro de client n'existe pas`, enrichedSalesCycle: null, customer: null})
                } else {
                    const res = await axios.get(`./api/order?weeknumber=${enrichedSalesCycle.salesCycle.targetWeek.weekNumber}&year=${enrichedSalesCycle.salesCycle.targetWeek.year}&slug=${slug}`)
                    if(res.status != 200) {
                        setSalesCycleState({ loading: false, error: `Erreur pendant le chargement de la commande : ${res.statusText}`, enrichedSalesCycle: null, customer: null})
                    } else {
                        if(res.data) {
                            customer.order = orderFromApiCallResult(res.data)
                        } else {
                            customer.order = createOrderWithDefaults(enrichedSalesCycle.salesCycle.targetWeek.weekNumber, enrichedSalesCycle.salesCycle.targetWeek.year, customer.slug)
                        }
                        setSalesCycleState({ loading: false, error: '', enrichedSalesCycle, customer })
                    }
                }
            } catch(e) {
                setSalesCycleState({ loading: false, error: e as string, enrichedSalesCycle: null, customer: null })
            }
        }
        if(slug){
            load()
        }
    }, [slug])

    let content = {} as JSX.Element
    if(salesCycleState.customer) {
        if (salesCycleState.customer.order?.status === OrderStatus.confirmed) {
            content = <Alert severity="success">Commande enregistrée ! Merci et à bientôt pour la livraison.</Alert>
        } else if (salesCycleState.enrichedSalesCycle && salesCycleState.enrichedSalesCycle.salesCycle.deadline < new Date()) {
            content = <Alert severity="error">Désolé, la période de commande est terminée depuis le {salesCycleState.enrichedSalesCycle.salesCycle.deadline.toLocaleDateString()} {salesCycleState.enrichedSalesCycle.salesCycle.deadline.toLocaleTimeString()}.</Alert>
        } else if (salesCycleState.customer.order?.status === OrderStatus.draft) {
            content = <EditOrder 
                enrichedSalesCycle={salesCycleState.enrichedSalesCycle!}
                customer={salesCycleState.customer!}
                mutateCustomer={(customer: CustomerData) => setSalesCycleState({...salesCycleState, ...{customer }})}
                refreshQuantities={refreshQuantities}/>
        }

        if(salesCycleState.enrichedSalesCycle && salesCycleState.enrichedSalesCycle.salesCycle){
            content = <Stack alignItems="stretch">
                <CustomerHeader customer={salesCycleState.customer!} salesCycle={salesCycleState.enrichedSalesCycle!.salesCycle}/>
                { content }
            </Stack>
        } else {
            return content
        }
    }

    return <Loader loading={salesCycleState.loading} error={salesCycleState.error} initial={false}>
        { content }
    </Loader>
}

export default Order

function createOrderWithDefaults(weekNumber: number, year: number, slug: string): OrderData {
    const mondayOfTargetWeek = getDateOfISOWeek(weekNumber, year)
    const thursdayOfTargetWeek = addDays(mondayOfTargetWeek, 3)
    const fridayOfTargetWeek = addDays(mondayOfTargetWeek, 4)

    return {
        slug,
        status: OrderStatus.draft,
        preferredDeliveryTimes: [{
            day: thursdayOfTargetWeek,
            times: [{deliveryTime: DeliveryTimes.h13, checked:false}, {deliveryTime: DeliveryTimes.h14, checked:false}, {deliveryTime: DeliveryTimes.h15, checked:false}]
        }, {
            day: fridayOfTargetWeek,
            times: [{deliveryTime: DeliveryTimes.h8, checked:false}, {deliveryTime: DeliveryTimes.h9, checked:false}, {deliveryTime: DeliveryTimes.h10, checked:false}, {deliveryTime: DeliveryTimes.h11, checked:false}, {deliveryTime: DeliveryTimes.h12, checked:false}] 
        }],
        quantities: [],
        quantitiesNonLocal: [],
        note: ''
    }
}