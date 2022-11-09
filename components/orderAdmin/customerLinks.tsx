import { useState, useEffect } from 'react'
import { Box, Link } from "@mui/material"
import { CustomerData } from "../../lib/common"
import { getData } from '../../lib/salesCycleCache'
import Loader from '../form/loader'

const CustomerLinks = () => {
    const [customersState, setCustomersState] = useState({ loading: false, error: '', customers: [] as CustomerData[]})
    useEffect(() => {
        const load = async () => {
            setCustomersState({ loading: true, error: '', customers: customersState.customers})
            try {
                const data = await getData()
                setCustomersState({ loading: false, error: '', customers: data.salesCycle.customers})
            } catch(e : any) {
                setCustomersState({ loading: false, error: e.toString(), customers: customersState.customers})
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <Loader loading={customersState.loading} error={customersState.error}>
        <Box display="flex" flexDirection="column">
            { customersState.customers.map(customer => <Link key={customer.slug} href={`${window.location.origin}/${customer.slug}`}>{customer.customerName}</Link> )}
        </Box>
    </Loader>
}

export default CustomerLinks