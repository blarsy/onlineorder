import { Box, Button, Stack, TextField, Typography, Alert } from '@mui/material'
import PeopleAlt from '@mui/icons-material/PeopleAlt'
import Storefront from '@mui/icons-material/Storefront'
import { LoadingButton } from '@mui/lab'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import { JSONTree } from 'react-json-tree'
import Loader from '../form/loader'
import axios from 'axios'
import {
    Formik,
    ErrorMessage,
    Form,
  } from 'formik'
import * as yup from 'yup'
import { isCurrentOrNextWeekNumber, getWeek } from '../../lib/dateWeek'
import Submit from '../form/submit'
import '../../lib/formCommon'
import { ConnectionData } from '../../lib/common'

interface Props {
    connectionData: ConnectionData
}

interface Values {
    weekNumber: number,
    year: number,
    deadline: Date
}

interface CreateQuantitiesSheetValues {
    weekNumber: number
}


const findNextWeekdayTime = (weekday: number, hour: number) => {
    const now = new Date()
    let refDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    while(refDate.getDay() != weekday){
        refDate = new Date(1000 * 60 * 60 * 24 + refDate.valueOf())
    }
    return new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), hour, 0, 0)
}

const DataFiles = ({ connectionData } : Props) => {
    const [creationError, setCreationError] = useState('')
    const [loadFileStatus, setLoadFileStatus] = useState({
        loading: false,
        error: '',
        initial: true,
        fileContent: null as object | null
    })
    const [updatingCustomers, setUpdatingCustomers] = useState({ working: false, error: '' })
    const [createQuantitiesSheet, setCreateQuantitiesSheet] = useState({ working: false, error: ''})

    return <Box display="flex" flexDirection="column" gap="1rem" alignItems="center">
        <Formik
            initialValues={{
                weekNumber: getWeek(new Date()),
                year: new Date().getFullYear(),
                deadline: findNextWeekdayTime(2, 11)
            }}
            validationSchema={ yup.object({
                weekNumber: yup.number().required().test((val, ctx) => {
                    if(val) {
                        if(!isCurrentOrNextWeekNumber(val)) {
                            return ctx.createError({ message: 'Le numéro de semaine doit être celui de la semaine actuelle ou de celle d\'après'})
                        }
                    }
                    return true
                }),
                year: yup.number().required().test((val, ctx) => {
                    if(val) {
                        const currentYear = new Date().getFullYear()
                        if(val != currentYear && val != currentYear +1) {
                            return ctx.createError({ message: 'L\'année doit être l\'actuelle ou de celle d\'après'})
                        }
                    }
                    return true
                }),
                deadline: yup.date().required().test((val, ctx) => {
                    if(val) {
                        if(val < new Date()) {
                            return ctx.createError({ message: 'La date de clôture doit être dans le futur.'})
                        }
                    }
                    return true
                })
            }) }
            onSubmit={async (
                values: Values
            ) => {
                try {
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    await axios.put('/api/orderweek', { message, signature, 
                        weekNumber: values.weekNumber, year: values.year, deadline: values.deadline })
                    setCreationError('')
                } catch (e) {
                    setCreationError((e as Error).toString())
                }
            }}
        >
    {({ isSubmitting, getFieldProps, errors, touched, setFieldValue, setTouched, values }) => (
    <Stack component={Form} gap="1rem">
        <TextField size="small" label="Numéro de semaine" 
            id="weekNumber" error={touched.weekNumber && !!errors.weekNumber}
            helperText={errors.weekNumber}
            {...getFieldProps('weekNumber')}></TextField>
        <TextField size="small" label="Année" 
            id="year" error={touched.year && !!errors.year}
            helperText={errors.year}
            {...getFieldProps('year')}></TextField>
        <DateTimePicker
            label="Clôture commandes"
            onChange={(value) => {
                setFieldValue('deadline', (value as Dayjs).toDate(), true)
                setTouched({ ...touched, ...{ deadline: true } })
            }}
            value={dayjs(values.deadline)}
            renderInput={(params) => <TextField {...params} />}
        />
        <Typography variant="body1" color="error"><ErrorMessage name="deadline" /></Typography>
        <Submit isSubmitting={isSubmitting} label="Générer nouveau fichier" submitError={creationError}/>
    </Stack>)}
        </Formik>
        <Formik
            initialValues={{
                weekNumber: getWeek(new Date())
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
                values: CreateQuantitiesSheetValues
            ) => {
                try {
                    setCreateQuantitiesSheet({ working: true, error: '' })
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    await axios.put('/api/quantitiessheet', { message, signature, 
                        weekNumber: values.weekNumber })
                    setCreateQuantitiesSheet({ working: false, error: '' })
                } catch (e) {
                    setCreateQuantitiesSheet({ working: false, error: (e as Error).toString()})
                }
            }}
        >
    {({ isSubmitting, getFieldProps, errors, touched }) => (
        <Stack component={Form} gap="1rem">
            <TextField size="small" label="Numéro de semaine" 
                id="weekNumber" error={touched.weekNumber && !!errors.weekNumber}
                helperText={errors.weekNumber}
                {...getFieldProps('weekNumber')}></TextField>
            <Submit isSubmitting={isSubmitting} label="Nouvelle feuille de quantités" submitError={createQuantitiesSheet.error}/>
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
        }}>Voir données actuelles</Button>
        <Loader loading={loadFileStatus.loading} error={loadFileStatus.error} initial={loadFileStatus.initial}>
            <JSONTree data={loadFileStatus.fileContent} />
        </Loader>
        <LoadingButton loading={updatingCustomers.working} loadingPosition="start" variant="contained" startIcon={<PeopleAlt />} onClick={async () => {
            setUpdatingCustomers({ working: true, error: '' })
            try{
                const message = new Date().toISOString()
                const signature = await connectionData.signer?.signMessage(message)
                await axios.patch('/api/orderweek', { message, signature, customers: 1 })
                setUpdatingCustomers({ working: false, error: '' })
            } catch(e: any) {
                setUpdatingCustomers({ working: false, error: e.toString() })
            }
        }} >Mettre à jour les clients</LoadingButton>
        { updatingCustomers.error && <Alert severity='error'>{updatingCustomers.error}</Alert>}
    </Box>
}

export default DataFiles