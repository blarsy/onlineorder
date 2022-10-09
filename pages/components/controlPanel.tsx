
import { useState } from 'react'
import { Box, Button, Chip, Stack, TextField } from '@mui/material'
import { JSONTree } from 'react-json-tree'
import Loader from './loader'
import axios from 'axios'
import {
    ErrorMessage,
    Formik,
    FormikHelpers,
    FormikProps,
    Form,
    Field,
    FieldProps,
  } from 'formik'
import * as yup from 'yup'
import { ConnectionData } from '../../lib/common'
import { isCurrentOrNextWeekNumber } from '../../lib/common'
import Submit from './form/submit'

interface Props {
    connectionData: ConnectionData
}

interface Values {
    weekNumber: number
}

yup.setLocale({
    mixed: {
      required: 'Obligatoire',
      notType: 'Type incorrect'
    }
  });

const ControlPanel = ({connectionData}: Props) => {
    const [creationError, setCreationError] = useState('')
    const [loadFileStatus, setLoadFileStatus] = useState({
        loading: false,
        error: '',
        initial: true,
        fileContent: null as object | null
    })
    return <Box display="flex" flexDirection="column" gap="1rem" alignItems="flex-start">
        <Chip label={'Connected : ' + connectionData.walletAddress.substring(0, 15) + '...'} color="success"/>
        <Formik
            initialValues={{
                weekNumber: new Date().getWeek(),
            }}
        validationSchema={ yup.object({
            weekNumber: yup.number().required().test((val, ctx) => {
                if(val) {
                    if(!isCurrentOrNextWeekNumber(val)) {
                        return ctx.createError({ message: 'Le numéro de semaine doit être celui de la semaine actuelle ou de celle d\'après'})
                    }
                }
                return true
             })
        }) }
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
            try {
                const message = new Date().toUTCString()
                const signature = await connectionData.signer?.signMessage(message)
                await axios.put('/api/orderweek', { message, signature, weekNumber: values.weekNumber })
                setCreationError('')
            } catch (e) {
                setCreationError((e as Error).toString())
            } finally {
                setSubmitting(false)
            }
        }}
      >
        {({ isSubmitting, getFieldProps, errors, touched }) => (
        <Stack component={Form} gap="1rem">
            <TextField size="small" label="Numéro de semaine" 
                id="weekNumber" error={touched.weekNumber && !!errors.weekNumber}
                helperText={errors.weekNumber}
                {...getFieldProps('weekNumber')}></TextField>

            <Submit isSubmitting={isSubmitting} label="Generate new source file" submitError={creationError}/>
        </Stack>)}
      </Formik>
        <Button onClick={async () => {
            setLoadFileStatus({ loading: true, error: '', initial: loadFileStatus.initial, fileContent: null })
            try {
                const fileContentRes = await axios.get('/api/orderweek')
                setLoadFileStatus({ loading: false, error: '', initial: false, fileContent: fileContentRes.data })
            } catch(e) {
                setLoadFileStatus({ loading: false, error: e as string, initial: loadFileStatus.initial, fileContent: null })
            }
        }}>Show current file</Button>
        <Loader loading={loadFileStatus.loading} error={loadFileStatus.error} initial={loadFileStatus.initial}>
            <JSONTree data={loadFileStatus.fileContent} />
        </Loader>
    </Box>
}

export default ControlPanel