import { useState, useEffect } from 'react'
import { Alert, Box, Button, Link, Typography } from "@mui/material"
import { CustomerData } from "../../lib/common"
import { getData } from '../../lib/form/salesCycleCache'
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
            <Typography variant="body1">Liens individuels à envoyer à chaque client (ou à utiliser pour encoder une commande par téléphone)</Typography>
            { customersState.customers.map(customer => <Box key={customer.slug} display="flex">
                <Link flex="1 0 60%" href={`${window.location.origin}/${customer.slug}`}>{customer.customerName}</Link>
                <Typography flex="1 0 60%">{customer.email}</Typography>
            </Box>)}
        </Box>
    </Loader>
}

export default CustomerLinks