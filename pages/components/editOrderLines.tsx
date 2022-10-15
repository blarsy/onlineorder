import { Box, Typography, Stack } from "@mui/material"
import axios from "axios"
import {
    Form,
    Formik,
  } from 'formik'
import { useState } from "react"
import * as yup from 'yup'
import { constants } from "zlib"
import { OrderData } from "../../lib/common"
import { EnrichedSalesCycle } from "../../lib/salesCycleCache"
import { OrderStepProps } from "./form/common"
import ProductsOrderTable from "./form/productsOrderTable"
import Submit from "./form/submit"
import OrderSummary from "./orderSummary"
import { ProductsQuantities } from "./types"

const EditOrderLines = ({ enrichedSalesCycle, customer, next, save }: OrderStepProps) => {
    const [saveQuantitiesError, setSaveQuantitiesError] = useState('')
    return <Formik
        initialValues={getInitialValues(enrichedSalesCycle, customer.order)}
        validationSchema={ yup.object(getValidationSchema(enrichedSalesCycle)) }
        onSubmit={async (values) => {
            try {
                const order = customer.order || {} as OrderData
                order.quantities = []
                Object.keys(values).forEach(ctrlId => {
                    if(values[ctrlId] != 0) {
                        const orderedProduct = enrichedSalesCycle.productsByCtrlId[ctrlId]
                        const quantityBeingAdded = {
                            productName: orderedProduct.name,
                            quantity: Number(values[ctrlId]),
                            price: orderedProduct.price,
                            category: orderedProduct.category,
                            unit: orderedProduct.unit
                        }
 
                        order.quantities.push(quantityBeingAdded)
                    }
                })
                const error = await save(customer, enrichedSalesCycle.salesCycle.targetWeek)
                if(error) {
                    setSaveQuantitiesError(error)
                } else {
                    next!()
                }
            } catch(e: any) {
                setSaveQuantitiesError(e.toString())
            }
        }}>
        {({ isSubmitting, getFieldProps, errors, touched, values }) => {
        let totalHtva = 0
        Object.keys(values).forEach(ctrlId => {
            if(Number(values[ctrlId]) != 0) {
                totalHtva += enrichedSalesCycle.productsByCtrlId[ctrlId].price * Number(values[ctrlId])
            }
        })
        return (<Box component={Form} alignSelf="center" display="flex" flexDirection="column" gap="1rem">
            { Object.keys(enrichedSalesCycle.productsByCategory).map((category, catIdx)=> {
                return <Box key={catIdx} margin="1rem 0 1rem 0" display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="h5">{category}</Typography>
                    <ProductsOrderTable 
                        products={enrichedSalesCycle.productsByCategory[category]}
                        touched={touched}
                        errors={errors}
                        getFieldProps={getFieldProps}
                        values={values}/>
                </Box>
            })
            }
            <OrderSummary totalHtva={totalHtva}/>
            <Stack alignItems="center">
                {Object.keys(errors).length > 0 && <Typography variant="overline" color="error.main">Il y a des erreurs dans les quantités entrées. Veuillez les corriger avant de pouvoir valider la commande.</Typography>}
                {Object.keys(touched).length > 0 && totalHtva === 0 && <Typography variant="overline" color="error.main">Cette commande est vide.</Typography>}
                <Submit disabled={Object.keys(errors).length > 0 || totalHtva === 0} label="Suivant" isSubmitting={isSubmitting} submitError={saveQuantitiesError} />
            </Stack>
        </Box>)
        }}
    </Formik>
}


function getInitialValues(enrichedSalesCycle: EnrichedSalesCycle, order: OrderData | undefined): ProductsQuantities {
    let result = {} as ProductsQuantities
    Object.keys(enrichedSalesCycle.productsByCategory).map((category) => {
        if (order) {
            enrichedSalesCycle.productsByCategory[category].map((productRec) => {
                const relevantQuantity = order.quantities.find(
                    quantity => quantity.productName == productRec.product.name && 
                    quantity.category == productRec.product.category &&
                    quantity.price == productRec.product.price)
                result[productRec.ctrlId] = relevantQuantity?.quantity || 0
            })
        } else {
            enrichedSalesCycle.productsByCategory[category].map((productRec) => {
                result[productRec.ctrlId] = 0
            })
        }
    })
    return result
}
function getValidationSchema(enrichedSalesCycle: EnrichedSalesCycle):any  {
    const result = {} as any
    Object.keys(enrichedSalesCycle.productsByCategory).map((category) => {
        enrichedSalesCycle.productsByCategory[category].map((productRec) => {
            result[productRec.ctrlId] = yup.number().max(productRec.product.quantity).min(0)
        })
    })
    return result
}

export default EditOrderLines