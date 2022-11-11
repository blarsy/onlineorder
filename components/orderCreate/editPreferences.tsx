import { useState } from 'react'
import { Box, Button, Stack, Typography } from "@mui/material"
import {
    Form,
    Formik,
  } from 'formik'
import * as yup from 'yup'
import { DeliveryTimes, OrderData } from "../../lib/common"
import DeliveryPreferenceInput from "./deliveryPreferenceInput"
import { makePrefCtrlId, OrderStepProps } from "../../lib/form/formCommon"
import Submit from "../form/submit"

const EditPreferences = ({ enrichedSalesCycle, customer, next, save }: OrderStepProps) => {
    const [savePrefsError, setSavePrefsError] = useState('')
    return <Stack alignItems="stretch" sx={{maxWidth: 'sm'}}>
        <Typography variant="overline">Voici nos heures de livraison. Nous ferons de notre mieux pour vous livrer dans les créneaux que vous sélectionnez ci-dessous:</Typography>
        <Formik initialValues={createInitialValues(customer.order!)}     
            validationSchema={yup.object(createValidationSchema(customer.order!))}
            onSubmit={async ( values ) => {
                Object.keys(values).forEach(key => { 
                    const [dummy, dateValue, hour] = key.match(/^(\d+)-(.+)$/)!
                    const day = new Date(Number(dateValue))
                    const hourKey = hour as keyof typeof DeliveryTimes
                    const deliveryDay = customer.order!.preferredDeliveryTimes.find(deliveryTime => deliveryTime.day.valueOf() == day.valueOf())!
                    const deliveryTime = deliveryDay.times.find(time => DeliveryTimes[time.deliveryTime] === DeliveryTimes[hourKey].toString())
                    if(deliveryTime){
                        deliveryTime.checked = values[key] as boolean
                    }
                })
                const error = await save(customer, enrichedSalesCycle.salesCycle.deliveryDate)
                if(error) {
                    setSavePrefsError(error)
                } else {
                    next!()
                }
            }}>
            {({ isSubmitting, getFieldProps, errors, touched, values }) => {
                return <Box component={Form}>
                    <DeliveryPreferenceInput values={values} deliveryTimes={customer.order!.preferredDeliveryTimes} getFieldProps={getFieldProps} errors={errors} touched={touched}/>
                    <Submit isSubmitting={isSubmitting} disabled={Object.keys(errors).length > 0} label="Etape suivante" submitError={savePrefsError}/>
                </Box>
            }}
        </Formik>
    </Stack>
}

export default EditPreferences

function createInitialValues(order: OrderData) : { [id: string]: boolean } {
    const values = {} as {[id: string]: boolean}
    order.preferredDeliveryTimes.forEach(dayPrefs => {
        dayPrefs.times.forEach(timeSlot => {
            values[makePrefCtrlId(dayPrefs.day, timeSlot.deliveryTime)] = timeSlot.checked
        })
    })
    return values
}

function createValidationSchema(order: OrderData) {
    const result = {} as any
    order.preferredDeliveryTimes.forEach(dayPrefs => {
        dayPrefs.times.forEach(timeSlot => {
            result[makePrefCtrlId(dayPrefs.day, timeSlot.deliveryTime)] = 
                yup.boolean()
        })
    })
    const allKeys = Object.keys(result)
    result[allKeys[0]] = yup.boolean().test(function (val, ctx) {
        const context = this
        if(!allKeys.some(key => context.parent[key] )) {
            return ctx.createError({ message: 'Sélectionnez au moins une disponibilité' })
        }
        return true
    })
    return result
}