import { Button, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import axios from 'axios'
import {
    Formik,
    Form,
    FieldArray,
    validateYupSchema,
    yupToFormErrors,
  } from 'formik'
import * as yup from 'yup'
import { addWorkingDays, findNextWeekdayTime } from '../../lib/dateWeek'
import Submit from '../form/submit'
import { ConnectionData, DeliveryTimes } from '../../lib/common'
import SheetsSelect from './sheetsSelect'
import { extractUiError } from '../../lib/form/formCommon'
import DeliveryForProductCategories from './deliveryForProductCategories'
import { AnyObject } from 'yup/lib/types'

const productCategories = JSON.parse(process.env.NEXT_PUBLIC_ODOO_PRODUCT_TAGS!) as string[]
interface Props {
    connectionData: ConnectionData,
    onCreated(): void
}

export interface DeliveryScheme {
    productCategories: string[]
    delivery: Date
    deliveryTimes: {[deliveryTimeId: string]: boolean}
}

export interface Values {
    deadline: Date
    sheetId: string
    deliverySchemes: DeliveryScheme[]
}

const allDeliveryTimes = [DeliveryTimes.h8, DeliveryTimes.h9, DeliveryTimes.h10, DeliveryTimes.h11, 
    DeliveryTimes.h12, DeliveryTimes.h13, DeliveryTimes.h14, DeliveryTimes.h15, DeliveryTimes.h16]

const makeDeliverySchemes = (deliverySchemes: DeliveryScheme[]) => {
    return deliverySchemes.map(scheme => {
        const deliveryTimes = {} as {[dayNum: number]: DeliveryTimes[]}
        Object.keys(scheme.deliveryTimes).filter(key => key.match(/^(\d+)-(.+)$/)).forEach(key => {
            const [dummy, dayNum, hour] = key.match(/^(\d+)-(.+)$/)!
            const hourKey = hour as keyof typeof DeliveryTimes
            if(scheme.deliveryTimes[key]) {
                if(!deliveryTimes[Number(dayNum)]) {
                    deliveryTimes[Number(dayNum)] = [DeliveryTimes[hourKey]]
                } else {
                    deliveryTimes[Number(dayNum)].push(DeliveryTimes[hourKey])
                }
            }
        })
        return { ...scheme, ...{ deliveryTimes: Object.keys(deliveryTimes).map(day => ({ day: addWorkingDays(scheme.delivery, Number(day) - 1), times: deliveryTimes[Number(day)]})) } }
    })
}

const CreateCampaign = ({ connectionData, onCreated } : Props) => {
    const [creationError, setCreationError] = useState('')

    const getAvailableCategories = (values: Values)=> {
        let result = [...productCategories]
        values.deliverySchemes.forEach(deliveryScheme => result = result.filter(cat => !deliveryScheme.productCategories.includes(cat)))
        return result
    }
    
    return <Formik
        initialValues={{
            deliverySchemes: [{
                productCategories,
                delivery: findNextWeekdayTime(4, 12),
                deliveryTimes: initialDeliveryTimesValues()
            }],
            deadline: findNextWeekdayTime(2, 11),
            sheetId: '',
            
        } as Values}
        validate={(values: Values)=> {
            const yupSchema = yup.object({
                sheetId: yup.number().required('Veuillez sélectionner une feuille source.'),
                deadline: yup.date().required().test('deadlineInTheFuture', 'La date de clôture doit être dans le futur.',val => !!val && val > new Date()),
                deliverySchemes: yup.array().of(yup.object({
                    productCategories: yup.array(yup.string()).min(1, 'Veuillez sélectionner au moins une catégorie de produits.'),
                    delivery: yup.date().required().test('deliveryInTheFuture', 'La date de livraison doit être dans le futur.',val => {
                        return !!val && (val > new Date())
                    }).test('deliveryAfterDeadline', 'Les dates de livraison doivent avoir lieu après a date de clôture des commandes.',
                        (val, ctx) => !!val && (val > ctx.options.context!.deadline)
                    ),
                    deliveryTimes: yup.object(initialDeliveryTimesValidationSchema()).test('AtLeast1DeliveryTime', 'Veuillez sélectionner au moins une plage horaire de livraison.', hasAtLeastOneDeliveryTimeSelected)
                })).min(1, 'Veuillez configurer au moins un créneau de livraison.')
            })
            try {
                //need to do it this way - and not via the classical 'validationSchema' Formik prop, 
                //so that validation can access the value of 'deadline' in the 'deliveryAfterDeadline' test above
                //ref: https://stackoverflow.com/questions/56125797/yup-validation-access-parent-parent
                validateYupSchema(values, yupSchema, true, values)
            } catch (e) {
                return yupToFormErrors(e)
            }
            
        }}
        onSubmit={async (
            values: Values
        ) => {
            console.log(values)
            try {
                const message = new Date().toUTCString()
                const signature = await connectionData.signer?.signMessage(message)

                const deliverySchemes = makeDeliverySchemes(values.deliverySchemes)
                
                await axios.put('/api/campaign', { message, signature, deliverySchemes,
                    deadline: values['deadline'] as Date, sheetId: values.sheetId as string 
                })
                setCreationError('')
                onCreated()
            } catch (e) {
                setCreationError(extractUiError(e))
            }
        }}
    >
        {({ isSubmitting, setFieldValue, getFieldProps, values, errors, touched }) => {
            const availableCategories = getAvailableCategories(values)
            return <Stack component={Form} gap="1rem">
                <SheetsSelect fieldProps={getFieldProps('sheetId')}/>
                <DateTimePicker InputProps={{size: 'small'}}
                    label="Clôture commandes"
                    onChange={(value) => {
                        setFieldValue('deadline', (value as Dayjs).toDate(), true)
                    }}
                    value={dayjs(values['deadline'] as Date)}
                    renderInput={(params) => <TextField {...params} />}
                />
                { errors.deadline && touched.deadline && <Typography variant="body1" color="error">{errors.deadline as string}</Typography>}
                <Typography variant="h6">Livraison des produits par catégorie</Typography>
                <FieldArray name="deliverySchemes"
                    render={arrayHelpers => <Stack spacing={2} padding="0 1rem">
                        {values.deliverySchemes.map((deliveryScheme, idx) => <DeliveryForProductCategories
                        canRemove={idx !== 0} key={idx} availableCategories={availableCategories} fieldName={`deliverySchemes[${idx}]`} value={deliveryScheme} 
                        setFieldValue={setFieldValue} onRemove={() => arrayHelpers.remove(idx)}/>)}
                        {availableCategories.length > 0 && <Button onClick={() => arrayHelpers.push({
                            productCategories: availableCategories,
                            delivery: findNextWeekdayTime(4, 12),
                            deliveryTimes: initialDeliveryTimesValues() 
                        })}>Ajouter un créneau de livraison</Button>}
                    </Stack>} />
                <Submit isSubmitting={isSubmitting} label="Nouvelle campagne" submitError={creationError}/>
            </Stack>
        }
        }
    </Formik>
}

export default CreateCampaign

const initialDeliveryTimesValues = (): {[id: string]: boolean} => {
    const values = {} as {[id: string]: boolean}
    [1, 2, 3].forEach(dayNum => {
        allDeliveryTimes.forEach(time => values[`${dayNum}-${time.toString()}`]= false)
    })
    return values
}

const initialDeliveryTimesValidationSchema = (): {[id: string]: yup.BooleanSchema<boolean | undefined, AnyObject, boolean | undefined>} => {
    const values = {} as {[id: string]: yup.BooleanSchema<boolean | undefined, AnyObject, boolean | undefined>}
    [1, 2, 3].forEach(dayNum => {
        allDeliveryTimes.forEach(time => values[`${dayNum}-${time.toString()}`]= yup.boolean())
    })
    return values
}

const hasAtLeastOneDeliveryTimeSelected = (deliveryTimes: {[id: string]: boolean | undefined}) => {
    for(const i of [1, 2, 3]) {
        for(const deliveryTime of allDeliveryTimes) {
            if(deliveryTimes[`${i}-${deliveryTime.toString()}`])
                return true
        }
    }
    return false
}