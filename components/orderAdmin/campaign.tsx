import { Box, Stack, Alert, Dialog, Button, Typography, Paper } from '@mui/material'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import PeopleAlt from '@mui/icons-material/PeopleAlt'
import Storefront from '@mui/icons-material/Storefront'
import { LoadingButton } from '@mui/lab'
import { useState, useEffect } from 'react'
import axios, { AxiosError } from 'axios'
import {
    Formik,
    Form,
  } from 'formik'
import * as yup from 'yup'
import { ConnectionData, SalesCycle, easyDateTime } from '../../lib/common'
import SheetsSelect from './sheetsSelect'
import CreateCampaign from './createCampaign'
import Loader from '../form/loader'
import { getData } from '../../lib/form/salesCycleCache'
import { extractUiError } from '../../lib/form/formCommon'

interface Props {
    connectionData: ConnectionData
}

interface Values {
    sheetId: string
}

const Campaign = ({ connectionData } : Props) => {
    const [updatingCustomers, setUpdatingCustomers] = useState({ working: false, error: '' })
    const [updatingProductsError, setUpdatingProductsError] = useState('')
    const [createCampaignOpen, setCreateCampaignOpen] = useState(false)
    const [currentCampaignInfo, setCurrentCampaignInfo] = useState({ loading: false, error:'', salesCycle: undefined as SalesCycle | undefined })

    const loadCampaign = async() => {
        setCurrentCampaignInfo({loading: true, error: '', salesCycle: undefined})
        try {
            const { salesCycle } = await getData()
            setCurrentCampaignInfo({loading: false, error: '', salesCycle})
        } catch(e: any) {
            setCurrentCampaignInfo({loading: false, error: extractUiError(e), salesCycle: undefined})
        }
    }

    useEffect(() => {
        loadCampaign()
    }, [])

    return <Box display="flex" flexDirection="column" gap="1rem" alignItems="center">
        <Typography variant="body1">Les quantités dans la feuillle de quantités sont clôturées ? C&apos;est le moment de créer une nouvelle campagne.</Typography>
        <Button variant="contained" onClick={() => setCreateCampaignOpen(true)}>Nouvelle campagne</Button>
        <Dialog maxWidth="lg" fullWidth={true} open={createCampaignOpen} onClose={() => setCreateCampaignOpen(false)} >
            <DialogTitle>Nouvelle campagne</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    La nouvelle campagne détruira l&apos;ancienne, assurez-vous d&apos;avoir traité toutes les commandes de la campagne active
                </DialogContentText>
                <CreateCampaign connectionData={connectionData} onCreated={() => {
                    setCreateCampaignOpen(false)
                    loadCampaign()
                }}></CreateCampaign>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setCreateCampaignOpen(false)}>Annuler</Button>
            </DialogActions>
        </Dialog>
        { currentCampaignInfo.error.includes('Aucune campagne active') ? <Alert severity="info">Aucune campagne active pour le moment</Alert>
        :(        <Loader loading={currentCampaignInfo.loading} error={currentCampaignInfo.error}>
            <Paper elevation={4} sx={{ display: 'flex', flexFlow: 'column', alignItems: 'center', padding: '1rem', gap: '0.5rem' }}>
                <Typography variant="h6">Campagne en cours. Livraisons: {easyDateTime(new Date(currentCampaignInfo.salesCycle?.deliveryDate!))}</Typography>
                <Typography variant="body1">Des clients ajoutés ? ou leurs infos ont été mises à jours ? C&apos;est ici:</Typography>
                <LoadingButton loading={updatingCustomers.working} loadingPosition="start" variant="contained" startIcon={<PeopleAlt />} onClick={async () => {
                    setUpdatingCustomers({ working: true, error: '' })
                    try{
                        const message = new Date().toISOString()
                        const signature = await connectionData.signer?.signMessage(message)
                        await axios.patch('/api/campaign', { message, signature, customers: 1 })
                        setUpdatingCustomers({ working: false, error: '' })
                    } catch(e: any) {
                        setUpdatingCustomers({ working: false, error: extractUiError(e) })
                    }
                }} >Mettre à jour les clients</LoadingButton>
                { updatingCustomers.error && <Alert severity='error'>{updatingCustomers.error}</Alert>}
                <Formik initialValues={{
                    sheetId: ''
                } as Values} validationSchema={ yup.object({
                    sheetId: yup.string().required('Veuillez sélectionner une feuille')
                })} onSubmit={async(values: Values) => {
                    try{
                        const message = new Date().toISOString()
                        const signature = await connectionData.signer?.signMessage(message)
                        await axios.patch('/api/campaign', { message, signature, products: 1, sheetId: values.sheetId })
                    } catch(e: any) {
                        setUpdatingProductsError(extractUiError(e))
                    }
                }}>
                {({ isSubmitting, getFieldProps, values }) => (
                    <Stack sx={{ border: '1px solid #444', padding: '0.5rem'}} component={Form} gap="0.5rem">
                        <Typography variant="body1">Des produits ajoutés dans la feuille de quantité ? ou leurs infos ont été mises à jours ? C&apos;est ici:</Typography>
                        <SheetsSelect fieldProps={getFieldProps('sheetId')} />
                        <LoadingButton type="submit" loading={isSubmitting} loadingPosition="start" 
                            variant="contained" startIcon={<Storefront />} >Mettre à jour les produits</LoadingButton>
                        { updatingProductsError && <Alert severity='error'>{updatingProductsError}</Alert>}
                    </Stack>)}
                </Formik>
            </Paper>
        </Loader>)
        }

    </Box>
}

export default Campaign
