import { useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material"
import {
    ErrorMessage,
    FieldArray,
    FieldArrayRenderProps,
    Form,
    Formik,
  } from 'formik'
import * as yup from 'yup'
import { easyDate, getDeliveryTimeLabel, OrderDeliveryPreferences } from "../../lib/common"
import { OrderStepProps } from "../../lib/form/formCommon"
import Submit from "../form/submit"

const EditPreferences = ({ enrichedSalesCycle, customer, next, prev, save }: OrderStepProps) => {
    const [savePrefsError, setSavePrefsError] = useState('')
    return <Stack alignItems="stretch" sx={{maxWidth: 'sm'}}>
        <Button variant="outlined" sx={{ alignSelf:'center' }} onClick={prev}>Etape précédente</Button>
        <Typography variant="overline">Voici nos heures de livraison. Nous ferons de notre mieux pour vous livrer dans les créneaux que vous sélectionnez ci-dessous:</Typography>
        <Formik initialValues={ { deliveryTimes : customer.order!.preferredDeliveryTimes } }
            validationSchema={yup.object({
                deliveryTimes: yup.array().of(yup.object({
                    prefs: yup.array().of(yup.object({
                        day: yup.date().required(),
                        times: yup.array().of(yup.object({
                            deliveryTime: yup.number().required(),
                            checked: yup.boolean()
                        }))
                    }))
                }).test('AtLeastOneHourSelected','Veuillez choisir au moins une heure de livraison.', val => {
                    const atLeastOneSelected = (input: any): boolean => {
                        for(const pref of input.prefs) {
                            for(const time of pref.times) {
                                if(time.checked) return true
                            }
                        }
                        return false
                    }
                    return !!val && 
                        atLeastOneSelected(val)
                })).min(1)
            })}
            onSubmit={async ( values ) => {
                customer.order!.preferredDeliveryTimes = values.deliveryTimes
                const error = await save(customer, enrichedSalesCycle.salesCycle.deadline)
                if(error) {
                    setSavePrefsError(error)
                } else {
                    next!()
                }
            }}>
            {({ isSubmitting, getFieldProps, errors, touched, values }) => {
                return <Box component={Form}>
                    <FieldArray name="deliveryTimes" render={(arrayHelpers: FieldArrayRenderProps) => values.deliveryTimes.map((deliveryTime, dtIdx) => (<Stack key={deliveryTime.deliverySchemeIndex}>
                            <Typography variant="h6">{enrichedSalesCycle.salesCycle.deliverySchemes[deliveryTime.deliverySchemeIndex].productCategories.join(', ')}</Typography>
                            <Stack>
                                <FieldArray name="prefs" render={(arrayHelpers: FieldArrayRenderProps) => {
                                    return <Stack>
                                        {deliveryTime.prefs.map((pref, pIdx) => (<Stack key={pIdx}>
                                            <Stack direction="row">
                                                <Typography variant="body1" width="4rem">{easyDate(pref.day)}</Typography>
                                                <FieldArray name="times" render={arrayHelpers => {
                                                    return pref.times.map((time, tIdx) => <Box key={tIdx} width="4rem">
                                                        <FormControlLabel value="top" control={<Checkbox {...getFieldProps(`deliveryTimes[${dtIdx}].prefs[${pIdx}].times[${tIdx}].checked`)} />}
                                                            checked={time.checked} label={<Typography variant="body1">{getDeliveryTimeLabel(time.deliveryTime)}</Typography>} 
                                                            labelPlacement="top" />
                                                    </Box>)
                                                }}/>
                                            </Stack>
                                        </Stack>))}
                                    </Stack>
                                }}/>
                            </Stack>
                            <Typography variant="body1" color="error"><ErrorMessage name={`deliveryTimes[${dtIdx}]`} /></Typography>
                        </Stack>))
                    }/>
                    <Submit isSubmitting={isSubmitting} disabled={Object.keys(errors).length > 0} label="Etape suivante" submitError={savePrefsError}/>
                </Box>
            }}
        </Formik>
    </Stack>
}

export default EditPreferences