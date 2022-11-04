import { Box, Typography, Stack } from "@mui/material"
import {
    Form,
    Formik,
  } from 'formik'
import { useState } from "react"
import * as yup from 'yup'
import { OrderData } from "../../lib/common"
import { EnrichedSalesCycle } from "../../lib/salesCycleCache"
import { OrderStepProps, ProductsQuantities } from "../../lib/formCommon"
import NonLocalProductsOrderTable from "../orderCreate/nonLocalProductsOrderTable"
import ProductsOrderTable from "./productsOrderTable"
import Submit from "../form/submit"
import OrderSummary from "./orderSummary"

const EditOrderLines = ({ enrichedSalesCycle, customer, next, save }: OrderStepProps) => {
    const [saveQuantitiesError, setSaveQuantitiesError] = useState('')
    return <Formik
        initialValues={getInitialValues(enrichedSalesCycle, customer.order)}
        validationSchema={ yup.object(getValidationSchema(enrichedSalesCycle)) }
        onSubmit={async (values) => {
            try {
                const order = customer.order || {} as OrderData
                order.quantities = []
                order.quantitiesNonLocal = []
                Object.keys(values).forEach(ctrlId => {
                    const id = ctrlId.toString()
                    if(values[id] != 0) {
                        if(ctrlId.startsWith('nl')){
                            const id = Number(ctrlId.substring(2))
                            const quantityBeingAdded = {
                                productId: id,
                                quantity: Number(values[ctrlId]),
                            }
     
                            order.quantitiesNonLocal.push(quantityBeingAdded)
                        } else {
                            const id = Number(ctrlId)
                            const quantityBeingAdded = {
                                productId: id,
                                quantity: Number(values[id])
                            }
     
                            order.quantities.push(quantityBeingAdded)
                        }
                    }
                })
                const error = await save(customer, enrichedSalesCycle.salesCycle.deliveryDate)
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
            if(Number(values[Number(ctrlId)]) != 0) {
                if(ctrlId.startsWith('nl')) {
                    const id = Number(ctrlId.substring(2))
                    totalHtva += enrichedSalesCycle.nonLocalProductsById[id].price * 
                        Number(values[ctrlId]) * 
                        Number(enrichedSalesCycle.nonLocalProductsById[id].packaging)
                } else {
                    totalHtva += enrichedSalesCycle.productsById[Number(ctrlId)].product.price * Number(values[Number(ctrlId)])
                }
            }
        })
        return (<Box component={Form} alignSelf="center" display="flex" flexDirection="column" gap="1rem">
            { Object.keys(enrichedSalesCycle.productsByCategory).map((category, catIdx)=> {
                return <Box key={catIdx} margin="1rem 0 1rem 0" display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="h5">{category}</Typography>
                    <ProductsOrderTable 
                        productIds={enrichedSalesCycle.productsByCategory[category]}
                        productsById={enrichedSalesCycle.productsById}
                        touched={touched}
                        errors={errors}
                        getFieldProps={getFieldProps}
                        values={values}/>
                </Box>
            })
            }
            { Object.keys(enrichedSalesCycle.nonLocalProductsByCategory).map((category, catIdx)=> {
                return <Box key={catIdx} margin="1rem 0 1rem 0" display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="h5">{category} - Origine hors coopérative (bio non-local)</Typography>
                    <NonLocalProductsOrderTable 
                        products={enrichedSalesCycle.nonLocalProductsByCategory[category]}
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
            enrichedSalesCycle.productsByCategory[category].map((productId) => {
                const relevantQuantity = order.quantities.find(quantity => quantity.productId == productId)
                result[productId] = relevantQuantity?.quantity || 0
            })
        } else {
            enrichedSalesCycle.productsByCategory[category].map((productId) => {
                result[productId] = 0
            })
        }
    })

    Object.keys(enrichedSalesCycle.nonLocalProductsByCategory).map((category) => {
        if (order) {
            enrichedSalesCycle.nonLocalProductsByCategory[category].map((product) => {
                const relevantQuantity = order.quantitiesNonLocal.find(quantity => quantity.productId == product.id)
                result[`nl${product.id}`] = relevantQuantity?.quantity || 0
            })
        } else {
            enrichedSalesCycle.nonLocalProductsByCategory[category].map((product) => {
                result[`nl${product.id}`] = 0
            })
        }
    })

    return result
}
function getValidationSchema(enrichedSalesCycle: EnrichedSalesCycle):any  {
    const result = {} as any
    Object.keys(enrichedSalesCycle.productsByCategory).map((category) => {
        enrichedSalesCycle.productsByCategory[category].map((productId) => {
            result[productId] = yup.number().max(enrichedSalesCycle.productsById[productId].updatedQuantity).min(0)
        })
    })
    Object.keys(enrichedSalesCycle.nonLocalProductsByCategory).map((category) => {
        enrichedSalesCycle.nonLocalProductsByCategory[category].map((product) => {
            result[`nl${product.id}`] = yup.number().min(0)
        })
    })
    return result
}

export default EditOrderLines