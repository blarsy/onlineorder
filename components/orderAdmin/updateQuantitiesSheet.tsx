import { Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import {
    Formik,
    Form,
  } from 'formik'
import * as yup from 'yup'
import axios from 'axios'
import { ConnectionData } from "../../lib/common"
import Submit from '../form/submit'
import SheetsSelect from './sheetsSelect'
import { extractUiError } from '../../lib/form/formCommon'

interface Props {
    connectionData: ConnectionData
}

interface UpdateQuantitiesSheetValues {
    sheetId: string
}

const UpdateQuantitiesSheets = ({ connectionData } : Props) => {
    const [updateQuantitiesSheet, setUpdateQuantitiesSheet] = useState({ working: false, error: ''})

    return <Paper sx={{ display: 'flex', flexDirection:'column', gap:'1rem', alignItems:'center', padding: '0.5rem' }} elevation={4}>
        <Typography variant="body1">Des nouveaux produits ajoutés en cours de cycle ? des noms, ou autres infos sur les produits ont été mis à jour ? C&apos;est ici.</Typography>
        <Formik
            initialValues={{
                sheetId: ''
            }}
            validationSchema={ yup.object({
                sheetId: yup.number()
            }) }
            onSubmit={async (
                values: UpdateQuantitiesSheetValues
            ) => {
                try {
                    setUpdateQuantitiesSheet({ working: true, error: '' })
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    await axios.patch('/api/quantitiessheet', { message, signature, sheetId: values.sheetId })
                    setUpdateQuantitiesSheet({ working: false, error: '' })
                } catch (e: any) {
                    setUpdateQuantitiesSheet({ working: false, error: extractUiError(e)})
                }
            }}
        >
        {({ isSubmitting, getFieldProps }) => (
            <Stack component={Form} gap="1rem">
                <SheetsSelect fieldProps={getFieldProps('sheetId')}/>
                <Submit isSubmitting={isSubmitting} label="Synchroniser feuille de quantités" submitError={updateQuantitiesSheet.error}/>
            </Stack>)
        }
        </Formik>
    </Paper>
}

export default UpdateQuantitiesSheets