import { useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material"
import {
    ErrorMessage,
    FieldArray,
    Form,
    Formik,
  } from 'formik'
import * as yup from 'yup'
import { DeliveryTimes, DeliveryTime, OrderData, DeliveryScheme, easyDate, getDeliveryTimeLabel } from "../../lib/common"
import { makePrefCtrlId, OrderStepProps } from "../../lib/form/formCommon"
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
                        })).test('AtLeastOneHourSelected','Veuillez choisir au moins une heure de livraison.', val => !!val && val.length > 0 && !!val.find(v => v.checked))
                    }))
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
                    <FieldArray name="deliveryTimes" render={arrayHelpers => values.deliveryTimes.map((deliveryTime, dtIdx) => (<Stack key={deliveryTime.deliverySchemeIndex}>
                            <Typography>{enrichedSalesCycle.salesCycle.deliverySchemes[deliveryTime.deliverySchemeIndex].productCategories.join(', ')}</Typography>
                            <Stack>
                                <FieldArray name="prefs" render={arrayHelpers => {
                                    return deliveryTime.prefs.map((pref, pIdx) => (<Stack key={pIdx}>
                                            <Stack direction="row">
                                            <Box width="4rem">{easyDate(pref.day)}</Box>
                                            <FieldArray name="times" render={arrayHelpers => {
                                                return pref.times.map((time, tIdx) => <Box key={tIdx} width="4rem">
                                                    <FormControlLabel value="top" control={<Checkbox {...getFieldProps(`deliveryTimes[${dtIdx}].prefs[${pIdx}].times[${tIdx}].checked`)} />}
                                                        checked={time.checked} label={getDeliveryTimeLabel(time.deliveryTime)} 
                                                        labelPlacement="top" />
                                                </Box>)
                                            }}/>
                                        </Stack>
                                        <Typography variant="body1" color="error"><ErrorMessage name={`deliveryTimes[${dtIdx}].prefs[${pIdx}].times`} /></Typography>
                                    </Stack>))
                                }}/>
                            </Stack>
                        </Stack>))
                    }/>
                    <Submit isSubmitting={isSubmitting} disabled={Object.keys(errors).length > 0} label="Etape suivante" submitError={savePrefsError}/>
                </Box>
            }}
        </Formik>
    </Stack>
}

export default EditPreferences