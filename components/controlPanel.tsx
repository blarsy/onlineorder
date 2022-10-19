import { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import * as yup from 'yup'
import { ConnectionData } from '../lib/common'
import OrdersFollowup from './ordersFollowup'
import DataFiles from './dataFiles'

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
            content = <DataFiles connectionData={connectionData} />
            break
        case 1:
            content = <OrdersFollowup />
            break
        default:
    }

    return <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Tabs sx={{ mb: '1rem' }} value={currentTab} centered onChange={(event: React.SyntheticEvent, newValue: number) => setCurrentTab(newValue)} >
          <Tab label="Gérer les semaines" />
          <Tab label="Suivi commandes" />
        </Tabs>
        { content }
    </LocalizationProvider>
}

export default ControlPanel