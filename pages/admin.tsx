import type { NextPage } from 'next'
import { useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import { ethers, providers } from 'ethers'
import ControlPanel from '../components/orderAdmin/controlPanel'
import { ConnectionData } from '../lib/common'

declare global {
    interface Window {
        ethereum?: providers.ExternalProvider;
    }
}

const Admin: NextPage = () => {
    const [error, setError] = useState('')
    const [connectionData, setConnectionData] = useState({
        walletAddress: '',
        signer: null as ethers.providers.JsonRpcSigner | null
    } as ConnectionData)
    const tryConnect = async () => {
        if(window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                provider.on('accountsChanged', tryConnect)
                provider.on('chainChanged', tryConnect)
    
                await provider.send("eth_requestAccounts", [])
                const signer = provider.getSigner()
                setConnectionData({ walletAddress: await signer.getAddress(), signer })
            } catch (ex) {
                setError('There was a failure connecting your wallet account.')
            }
        } else {
            setError('Could not detect Metamask, is it installed ?')
        }
    }
    return (
        <Box display='flex' flexDirection='column' alignItems='center' flexGrow='1'>
            { !connectionData.walletAddress && <Button variant="contained" sx={{ alignSelf: 'center' }} onClick={tryConnect}>Connect</Button>}
            {error && <Alert variant="filled" severity="error">{error}</Alert>}
            { connectionData.walletAddress &&  <ControlPanel connectionData={connectionData}/>}
        </Box>
    )
}

export default Admin
