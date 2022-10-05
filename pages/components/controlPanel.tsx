
import { useState } from 'react'
import { Box, Button, Chip, Typography } from '@mui/material'
import { ConnectionData } from '../../lib/common'
import Loader from './loader'
import axios from 'axios'

interface Props {
    connectionData: ConnectionData
}

const ControlPanel = ({connectionData}: Props) => {
    const [creationStatus, setCreationStatus] = useState({
        creating: false,
        error: '',
        initial: true
    })
    return <Box display="flex" flexDirection="column" gap="1rem">
        <Chip label={'Connected : ' + connectionData.walletAddress.substring(0, 15) + '...'} color="success"/>
        <Button variant="contained" onClick={async () => {
            setCreationStatus({ creating: true, error: '', initial: creationStatus.initial})
            try {
                await axios.put('/api/orderweek')
                setCreationStatus({ creating: false, error: '', initial: false})
            }catch (e) {
                setCreationStatus({ creating: false, error: e as string, initial: creationStatus.initial})
            }
            
        }}>Generate new source file</Button>
        <Loader loading={creationStatus.creating} error={creationStatus.error} initial={creationStatus.initial}>
            <Typography>File created !</Typography>
        </Loader>
    </Box>
}

export default ControlPanel