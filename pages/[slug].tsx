import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CustomerData, SalesCycle } from '../lib/common'
import { getData } from '../lib/salesCycleCache'
import EditOrder from './components/editOrder'
import Loader from './components/loader'

const Order = () => {
    const router = useRouter()
    const { slug } = router.query
    const [salesCycleState, setSalesCycleState] = useState({ 
        loading: true, 
        error: '', 
        salesCycle: null as SalesCycle | null,
        customer: null as CustomerData | null
    })
    
    useEffect(() => {
        const load = async () => {
            setSalesCycleState({ loading: true, error: '', salesCycle: null, customer: null })
            try {
                const salesCycle = await getData()
                const customer = salesCycle.customers.find(customer => customer.slug === slug)
                if(!customer){
                    setSalesCycleState({ loading: false, error: `Ce numéro de client n'existe pas`, salesCycle: null, customer: null})
                } else {
                    setSalesCycleState({ loading: false, error: '', salesCycle, customer })
                }
            } catch(e) {
                setSalesCycleState({ loading: false, error: e as string, salesCycle: null, customer: null })
            }
        }
        if(slug){
            load()
        }
    }, [slug])

    return <Loader loading={salesCycleState.loading} error={salesCycleState.error} initial={false}>
        <EditOrder customer={salesCycleState.customer!}/>
    </Loader>
}

export default Order