import { Box, Button, Stack, TextField, Typography, Alert, InputLabel, FormControlLabel, Checkbox } from '@mui/material'
import PeopleAlt from '@mui/icons-material/PeopleAlt'
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
import { addWorkingDays, findNextWeekdayTime } from '../../lib/dateWeek'
import Submit from '../form/submit'
import { easyDate, getDeliveryTimeLabel, makePrefCtrlId } from '../../lib/formCommon'
import { ConnectionData, DeliveryTime, DeliveryTimes } from '../../lib/common'
import SheetsSelect from './sheetsSelect'

interface Props {
    connectionData: ConnectionData
}

interface Values {
    [propId: string]: Date | boolean | string
}

const allDeliveryTimes = [DeliveryTimes.h8, DeliveryTimes.h9, DeliveryTimes.h10, DeliveryTimes.h11, 
    DeliveryTimes.h12, DeliveryTimes.h13, DeliveryTimes.h14, DeliveryTimes.h15, DeliveryTimes.h16]

const DataFiles = ({ connectionData } : Props) => {
    const [creationError, setCreationError] = useState('')
    const [loadFileStatus, setLoadFileStatus] = useState({
        loading: false,
        error: '',
        initial: true,
        fileContent: null as object | null
    })
    const [updatingCustomers, setUpdatingCustomers] = useState({ working: false, error: '' })

    return <Box display="flex" flexDirection="column" gap="1rem" alignItems="center">
        <Formik
            initialValues={{
                delivery: findNextWeekdayTime(4, 12),
                deadline: findNextWeekdayTime(2, 11),
                sheetId: '',
                ...initialDeliveryTimesValues(findNextWeekdayTime(4, 12))
            } as Values}
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
                values: Values
            ) => {
                try {
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    const deliveryTimes = {} as {[dayNum: number]: DeliveryTimes[]}
                    Object.keys(values).filter(key => key.match(/^(\d+)-(.+)$/)).forEach(key => {
                        const [dummy, dayNum, hour] = key.match(/^(\d+)-(.+)$/)!
                        const hourKey = hour as keyof typeof DeliveryTimes
                        if(values[key]) {
                            if(!deliveryTimes[Number(dayNum)]) {
                                deliveryTimes[Number(dayNum)] = [DeliveryTimes[hourKey]]
                            } else {
                                deliveryTimes[Number(dayNum)].push(DeliveryTimes[hourKey])
                            }
                        }
                    })
                    await axios.put('/api/orderweek', { message, signature, delivery: values['delivery'] as Date, 
                        deadline: values['deadline'] as Date, sheetId: values.sheetId as string, 
                        deliveryTimes: Object.keys(deliveryTimes).map(day => ({ day: addWorkingDays(values['delivery'] as Date, Number(day) - 1), times: deliveryTimes[Number(day)]})) 
                    })
                    setCreationError('')
                } catch (e) {
                    setCreationError((e as Error).toString())
                }
            }}
        >
            {({ isSubmitting, errors, touched, setFieldValue, setTouched, getFieldProps, values }) => (
            <Stack component={Form} gap="1rem">
                <SheetsSelect fieldProps={getFieldProps('sheetId')}/>
                <DateTimePicker
                    label="Début livraisons"
                    onChange={(value) => {
                        setFieldValue('delivery', (value as Dayjs).toDate(), true)
                        setTouched({ ...touched, ...{ deadline: true } })
                    }}
                    value={dayjs(values['delivery'] as Date)}
                    renderInput={(params) => <TextField {...params} />}
                />
                <Typography variant="body1" color="error"><ErrorMessage name="delivery" /></Typography>
                <DateTimePicker
                    label="Clôture commandes"
                    onChange={(value) => {
                        setFieldValue('deadline', (value as Dayjs).toDate(), true)
                        setTouched({ ...touched, ...{ deadline: true } })
                    }}
                    value={dayjs(values['deadline'] as Date)}
                    renderInput={(params) => <TextField {...params} />}
                />
                <InputLabel id="deliveryPrefsLabel">Créneaux de livraisons</InputLabel>
                {[1, 2, 3].map(dayNumber => {
                    return <Box key={dayNumber} display="flex" alignItems="center" flexWrap="wrap">
                        <Box flex="0 0 3rem">{easyDate(addWorkingDays((values['delivery']) as Date, dayNumber - 1))}</Box>
                        {allDeliveryTimes.map(deliveryTime => {
                                const ctrlId = `${dayNumber}-${deliveryTime.toString()}`
                                return <Box flex="0 0 5rem" key={ctrlId}>
                                    <FormControlLabel
                                        value="top"
                                        control={<Checkbox {...getFieldProps(ctrlId)}/>}
                                        checked={values[ctrlId] as boolean}
                                        label={getDeliveryTimeLabel(deliveryTime)}
                                        labelPlacement="top" />
                                </Box>})
                        }
                    </Box>
                })}
                <Typography variant="body1" color="error"><ErrorMessage name="deadline" /></Typography>
                <Submit isSubmitting={isSubmitting} label="Nouvelle campagne" submitError={creationError}/>
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

const initialDeliveryTimesValues = (delivery: Date): {[id: string]: boolean} => {
    const values = {} as {[id: string]: boolean}
    [1, 2, 3].forEach(dayNum => {
        allDeliveryTimes.forEach(time => values[`${dayNum}-${time.toString()}`]= false)
    })
    return values
}
