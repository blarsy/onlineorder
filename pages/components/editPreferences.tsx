import { Box, Button } from "@mui/material"
import {
    Form,
    Formik,
  } from 'formik'
import * as yup from 'yup'
import { DeliveryTimes, OrderData } from "../../lib/common"
import DeliveryPreferenceInput from "./deliveryPrefernceInput"
import { makePrefCtrlId, OrderStepProps } from "./form/common"

const EditPreferences = ({ enrichedSalesCycle, customer, next, prev }: OrderStepProps) => {
    return <Box>
        <Button onClick={prev}>Retour aux produits</Button>
        <Formik initialValues={createInitialValues(customer.order!)}
            validationSchema={createValidationSchema(customer.order!)}
            onSubmit={() => {}}>
            {({ isSubmitting, getFieldProps, errors, touched, values }) => {
                return <Box component={Form}>
                    <DeliveryPreferenceInput values={values} order={customer.order!} getFieldProps={getFieldProps} errors={errors} touched={touched}/>
                </Box>
            }}
        </Formik>
    </Box>
}

export default EditPreferences

function createInitialValues(order: OrderData) : {[id: string]: boolean} {
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
        if(!allKeys.some(key => this.parent[key])) {
            return ctx.createError({ message: 'Sélectionnez au moins une disponibilité pour la livraison' })
        }
        return true
    })
    return result
}