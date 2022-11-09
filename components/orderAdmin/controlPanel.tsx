import { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import * as yup from 'yup'
import { ConnectionData } from '../../lib/common'
import OrdersFollowup from './ordersFollowup'
import CustomerLinks from './customerLinks'
import Campaign from './campaign'
import QuantitiesSheets from './quantitiesSheets'

yup.setLocale({
    mixed: {
      required: 'Obligatoire',
      notType: 'Type incorrect'
    }
  })

interface Props {
    connectionData: ConnectionData
}

const ControlPanel = ({connectionData}: Props) => {
    const [currentTab, setCurrentTab] = useState(0)

    let content
    switch(currentTab) {
        case 0:
            content = <QuantitiesSheets connectionData={connectionData} />
            break
        case 1:
            content = <Campaign connectionData={connectionData} />
            break
        case 2:
            content = <OrdersFollowup />
            break
        case 3:
            content = <CustomerLinks />
            break
        default:
    }

    return <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Tabs sx={{ mb: '1rem' }} value={currentTab} centered onChange={(event: React.SyntheticEvent, newValue: number) => setCurrentTab(newValue)} >
            <Tab label="Stocks partagés" />
            <Tab label="Campagnes" />
            <Tab label="Suivi commandes" />
            <Tab label="Liens commande clients" />
        </Tabs>
        { content }
    </LocalizationProvider>
}

export default ControlPanel