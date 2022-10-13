import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { CustomerData, DeliveryTimes, OrderData, OrderStatus } from '../lib/common'
import { EnrichedSalesCycle, getData } from '../lib/salesCycleCache'
import EditOrder from './components/editOrder'
import Loader from './components/loader'
import { addDays, getDateOfISOWeek } from '../lib/dateWeek'

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
    
    useEffect(() => {
        const load = async () => {
            setSalesCycleState({ loading: true, error: '', enrichedSalesCycle: null, customer: null })
            try {
                const enrichedSalesCycle = await getData()
                const customer = enrichedSalesCycle.salesCycle.customers.find(customer => customer.slug === slug)
                if(!customer){
                    setSalesCycleState({ loading: false, error: `Ce numéro de client n'existe pas`, enrichedSalesCycle: null, customer: null})
                } else {
                    const res = await axios(`./api/order?weeknumber=${enrichedSalesCycle.salesCycle.targetWeek.weekNumber}&year=${enrichedSalesCycle.salesCycle.targetWeek.year}&slug=${slug}`)
                    if(res.status != 200) {
                        setSalesCycleState({ loading: false, error: `Erreur pendant le chargement de la commande : ${res.statusText}`, enrichedSalesCycle: null, customer: null})
                    } else {
                        if(res.data) {
                            customer.order = orderFromApiCallResult(res.data)
                        } else {
                            customer.order = createOrderWithDefaults(enrichedSalesCycle.salesCycle.targetWeek.weekNumber, enrichedSalesCycle.salesCycle.targetWeek.year)
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

    return <Loader loading={salesCycleState.loading} error={salesCycleState.error} initial={false}>
        <EditOrder 
            enrichedSalesCycle={salesCycleState.enrichedSalesCycle!}
            customer={salesCycleState.customer!}/>
    </Loader>
}

export default Order

function createOrderWithDefaults(weekNumber: number, year: number): OrderData {
    const mondayOfTargetWeek = getDateOfISOWeek(weekNumber, year)
    const thursdayOfTargetWeek = addDays(mondayOfTargetWeek, 4)
    const fridayOfTargetWeek = addDays(mondayOfTargetWeek, 5)

    return {
        status: OrderStatus.draft,
        preferredDeliveryTimes: [{
            day: thursdayOfTargetWeek,
            times: [{deliveryTime: DeliveryTimes.h13, checked:false}, {deliveryTime: DeliveryTimes.h14, checked:false}, {deliveryTime: DeliveryTimes.h15, checked:false}]
        }, {
            day: fridayOfTargetWeek,
            times: [{deliveryTime: DeliveryTimes.h8, checked:false}, {deliveryTime: DeliveryTimes.h9, checked:false}, {deliveryTime: DeliveryTimes.h10, checked:false}, {deliveryTime: DeliveryTimes.h11, checked:false}, {deliveryTime: DeliveryTimes.h12, checked:false}] 
        }],
        quantities: [],
        note: ''
    }
}