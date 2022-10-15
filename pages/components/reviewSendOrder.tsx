import { useState } from 'react'
import { Stack, Typography, Button, TextField } from "@mui/material"
import {
    Form,
    Formik,
  } from 'formik'
import { OrderStatus } from "../../lib/common"
import { OrderStepProps } from "./form/common"
import Submit from "./form/submit"
import OrderLinesSummary from "./orderLinesSummary"
import OrderSummary from "./orderSummary"
import DeliveryPreferences from './deliveryPreferences'

const ReviewSendOrder = ({ enrichedSalesCycle, customer, prev, save, mutateCustomer }: OrderStepProps) => {
    const [confirmError, setConfirmError] = useState('')
    const totalProductsHtva = customer.order!.quantities.reduce<number>((acc, quantity) => acc += quantity.price * Number(quantity.quantity), 0)
    const totalNonLocalProductsHtva  = customer.order!.quantitiesNonLocal.reduce<number>((acc, quantity) => acc += quantity.price * Number(quantity.quantity) * Number(quantity.packaging), 0)
    const totalHtva = totalProductsHtva + totalNonLocalProductsHtva
    return <Stack alignSelf="stretch" alignItems="stretch" spacing={1}>
        <Button onClick={prev}>Etape précédente</Button>
        <Typography variant="h5">Passez votre commande en revue</Typography>
        <OrderLinesSummary order={customer.order!} />
        <OrderSummary totalHtva={totalHtva} />
        <DeliveryPreferences order={customer.order!} />
        <Formik initialValues={{ note: customer.order!.note }} onSubmit={async (values) => {
            customer.order!.note = values['note']
            customer.order!.status = OrderStatus.confirmed
            try {
                const error = await save(customer, enrichedSalesCycle.salesCycle.targetWeek)
                if(error) {
                    customer.order!.status = OrderStatus.draft
                    setConfirmError(error)
                }
                mutateCustomer!(customer)
            } catch(e) {
                customer.order!.status = OrderStatus.draft
                setConfirmError((e as Error).toString())
            }
        }}>
        {({ isSubmitting, getFieldProps }) => {
            return <Stack spacing={1} component={Form}>
                <TextField sx={{ width: '100%'}} minRows="3" {...getFieldProps('note')}/>
                <Submit label="Confirmer la commande" isSubmitting={isSubmitting} submitError={confirmError}/>
            </Stack>}
        }
        </Formik>
    </Stack>
}

export default ReviewSendOrder