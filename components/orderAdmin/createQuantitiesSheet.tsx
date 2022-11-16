import { Paper, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import {
    Formik,
    ErrorMessage,
    Form,
  } from 'formik'
import * as yup from 'yup'
import axios from 'axios'
import { ConnectionData } from "../../lib/common"
import { findNextWeekdayTime } from '../../lib/dateWeek'
import Submit from '../form/submit'
import '../../lib/form/formCommon'
import SheetsSelect from './sheetsSelect'

interface Props {
    connectionData: ConnectionData
}

interface CreateQuantitiesSheetValues {
    delivery: Date
    deadline: Date
    sheetId: string
}

const CreateQuantitiesSheets = ({ connectionData } : Props) => {
    const [createQuantitiesSheet, setCreateQuantitiesSheet] = useState({ working: false, error: ''})

    return <Paper sx={{ display: 'flex', flexDirection:'column', gap:'1rem', alignItems:'center', padding: '0.5rem' }} elevation={4}>
        <Typography variant="body1">Un nouveau cycle de commande ? Ca commence par une nouvelle feuille de quantité. C&apos;est ici.</Typography>
        <Formik
            initialValues={{
                delivery: findNextWeekdayTime(4, 12),
                deadline: findNextWeekdayTime(2,11),
                sheetId: ''
            }}
            validationSchema={ yup.object({
                delivery: yup.date().required().test((val, ctx) => {
                    if(val) {
                        if(val < new Date()) {
                            return ctx.createError({ message: 'La date de livraison doit être dans le futur.'})
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
                }).test('deadlineBeforeDelivery', 'La date de clôture des commandes doit avoir lieu avant la date de livraison.',
                    function(val){
                        return !!val && (val < this.parent.delivery)
                    }
                ),
                sheetId: yup.number()
            }) }
            onSubmit={async (
                values: CreateQuantitiesSheetValues
            ) => {
                try {
                    setCreateQuantitiesSheet({ working: true, error: '' })
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    await axios.put('/api/quantitiessheet', { message, signature, 
                        delivery: values.delivery, deadline: values.deadline, sheetId: values.sheetId })
                    setCreateQuantitiesSheet({ working: false, error: '' })
                } catch (e) {
                    setCreateQuantitiesSheet({ working: false, error: (e as Error).toString()})
                }
            }}
        >
        {({ isSubmitting, setFieldValue, setTouched, touched, values, getFieldProps }) => (
            <Stack component={Form} gap="1rem">
               <SheetsSelect fieldProps={getFieldProps('sheetId')}/>
                <DateTimePicker
                    label="Début livraisons"
                    onChange={(value) => {
                        setFieldValue('delivery', (value as Dayjs).toDate(), true)
                        setTouched({ ...touched, ...{ deadline: true } })
                    }}
                    value={dayjs(values.delivery)}
                    renderInput={(params) => <TextField {...params} />}
                />
                <Typography variant="body1" color="error"><ErrorMessage name="delivery" /></Typography>
                <DateTimePicker
                    label="Clôture"
                    onChange={(value) => {
                        setFieldValue('deadline', (value as Dayjs).toDate(), true)
                        setTouched({ ...touched, ...{ deadline: true } })
                    }}
                    value={dayjs(values.deadline)}
                    renderInput={(params) => <TextField {...params} />}
                />
                <Typography variant="body1" color="error"><ErrorMessage name="deadline" /></Typography>
                <Submit isSubmitting={isSubmitting} label="Nouvelle feuille de quantités" submitError={createQuantitiesSheet.error}/>
            </Stack>)
        }
        </Formik>
    </Paper>
}

export default CreateQuantitiesSheets