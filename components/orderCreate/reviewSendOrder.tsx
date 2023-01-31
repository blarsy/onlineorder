import { useState } from 'react'
import { Stack, Typography, Button, TextField } from "@mui/material"
import {
    Form,
    Formik,
  } from 'formik'
import { OrderStatus } from "../../lib/common"
import { OrderStepProps } from "../../lib/form/formCommon"
import Submit from "../form/submit"
import OrderLinesSummary from "../orderAdmin/orderLinesSummary"
import OrderSummary from "./orderSummary"
import DeliveryPreferences from './deliveryPreferences'

const ReviewSendOrder = ({ enrichedSalesCycle, customer, prev, save, mutateCustomer }: OrderStepProps) => {
    const [confirmError, setConfirmError] = useState('')
    const totalProductsHtva = customer.order!.quantities.reduce<number>((acc, quantity) => {
        const productInfo = enrichedSalesCycle.productsById[quantity.productId] 
        return acc += productInfo.product.price * Number(quantity.quantity)
    }, 0)
    const totalNonLocalProductsHtva  = customer.order!.quantitiesNonLocal.reduce<number>((acc, quantity) => {
        const product = enrichedSalesCycle.nonLocalProductsById[quantity.productId] 
        return acc += product.price * Number(quantity.quantity) * Number(product.packaging)
    }, 0)
    const totalHtva = totalProductsHtva + totalNonLocalProductsHtva
    return <Stack alignSelf="stretch" alignItems="stretch" spacing={1}>
        <Button sx={{ alignSelf:"center" }} variant="outlined" onClick={prev}>Etape précédente</Button>
        <Typography variant="h5">Passez votre commande en revue</Typography>
        <OrderLinesSummary order={customer.order!} enrichedSalesCycle={enrichedSalesCycle} />
        <OrderSummary totalHtva={totalHtva} />
        <DeliveryPreferences salesCycle={enrichedSalesCycle.salesCycle} order={customer.order!} />
        <Formik initialValues={{ note: customer.order!.note }} onSubmit={async (values) => {
            customer.order!.note = values['note']
            customer.order!.status = OrderStatus.confirmed
            try {
                const error = await save(customer, enrichedSalesCycle.salesCycle.deadline)
                if(error) {
                    customer.order!.status = OrderStatus.draft
                    setConfirmError(error)
                }
                mutateCustomer!(customer)
            } catch(e : any) {
                customer.order!.status = OrderStatus.draft
                if(e.response && e.response.data && e.response.data && e.response.data.error.includes('out of stock')) {
                    setConfirmError('Malheureusement, certains produits ont été commandés et confirmés par d\'autres clients pendant que vous composiez votre commande ici, et ne sont donc plus disponibles. Veuillez revenir en arrière et rééxaminer les quantités disponibles.')
                } else {
                    setConfirmError((e as Error).message)
                }
            }
        }}>
        {({ isSubmitting, getFieldProps }) => {
            return <Stack spacing={1} component={Form}>
                <Typography variant="overline">Avez-vous une note à communiquer à nos services concernant cette commande ?</Typography>
                <TextField sx={{ width: '100%'}} minRows="3" {...getFieldProps('note')}/>
                <Submit label="Confirmer la commande" isSubmitting={isSubmitting} submitError={confirmError}/>
            </Stack>}
        }
        </Formik>
    </Stack>
}

export default ReviewSendOrder