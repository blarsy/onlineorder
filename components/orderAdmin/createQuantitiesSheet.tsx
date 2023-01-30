import { Button, Checkbox, FormControlLabel, FormGroup, IconButton, InputLabel, Paper, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import {
    Formik,
    ErrorMessage,
    Form,
    validateYupSchema,
    yupToFormErrors,
    FieldArray,
  } from 'formik'
import * as yup from 'yup'
import axios from 'axios'
import DeleteIcon from '@mui/icons-material/Delete'
import { ConnectionData, DeliveryDate } from "../../lib/common"
import { findNextWeekdayTime } from '../../lib/dateWeek'
import Submit from '../form/submit'
import '../../lib/form/formCommon'
import SheetsSelect from './sheetsSelect'
import { extractUiError } from '../../lib/form/formCommon'

interface Props {
    connectionData: ConnectionData
}

interface CreateQuantitiesSheetValues {
    deliveryDates: DeliveryDate[]
    deadline: Date
    sheetId: string
}

const productCategories = JSON.parse(process.env.NEXT_PUBLIC_ODOO_PRODUCT_TAGS!) as string[]


const CreateQuantitiesSheets = ({ connectionData } : Props) => {
    const [createQuantitiesSheet, setCreateQuantitiesSheet] = useState({ working: false, error: ''})

    return <Paper sx={{ display: 'flex', flexDirection:'column', gap:'1rem', alignItems:'center', padding: '0.5rem' }} elevation={4}>
        <Typography variant="body1">Un nouveau cycle de commande ? Ca commence par une nouvelle feuille de quantité. C&apos;est ici.</Typography>
        <Formik
            initialValues={{
                deliveryDates: [{
                    date: findNextWeekdayTime(4, 12),
                    productCategories
                }],
                deadline: findNextWeekdayTime(2,11),
                sheetId: ''
            } as CreateQuantitiesSheetValues}
            validate={(values) =>{ 
                const yupSchema = yup.object({
                    deliveryDates: yup.array().of(yup.object({
                            date: yup.date().required().test('deliveryInFuture', 'La date de livraison doit être dans le futur.', val => !!val && val > new Date())
                                .test('deliveryAfterDeadline', 'Les livraisons doivent avoir lieu après la date de clôture', (val, ctx) => !!val && val > ctx.options.context!.deadline),
                            productCategories: yup.array(yup.string()).min(1, 'Veuillez sélectionner au moins une catégorie de produits.')
                        })).min(1, 'Veuillez fournir au moins une date de livraison.'),
                    deadline: yup.date().required().test('deadlineInFuture', 'La date de clôture doit être dans le futur.', val => !!val && val > new Date()),
                    sheetId: yup.number()
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
                values: CreateQuantitiesSheetValues
            ) => {
                try {
                    setCreateQuantitiesSheet({ working: true, error: '' })
                    const message = new Date().toUTCString()
                    const signature = await connectionData.signer?.signMessage(message)
                    await axios.put('/api/quantitiessheet', { message, signature, 
                        deliveryDates: values.deliveryDates, deadline: values.deadline, sheetId: values.sheetId })
                    setCreateQuantitiesSheet({ working: false, error: '' })
                } catch (e: any) {
                    setCreateQuantitiesSheet({ working: false, error: extractUiError(e)})
                }
            }}
        >
        {({ isSubmitting, setFieldValue, setTouched, touched, values, getFieldProps }) => {
            let availableCategories = [...productCategories]
            for(const deliveryDate of values.deliveryDates) {
                availableCategories = availableCategories.filter(cat => !deliveryDate.productCategories.includes(cat))
            }

            return <Stack component={Form} gap="1rem">
               <SheetsSelect fieldProps={getFieldProps('sheetId')}/>
                <DateTimePicker InputProps={{size: 'small'}}
                    label="Clôture"
                    onChange={(value) => {
                        setFieldValue('deadline', (value as Dayjs).toDate())
                        setTouched({ ...touched, ...{ deadline: true } })
                    }}
                    value={dayjs(values.deadline)}
                    renderInput={(params) => <TextField {...params} />}
                />
                <Typography variant="body1" color="error"><ErrorMessage name="deadline" /></Typography>
                <Typography variant="h6">Dates de livraisons prévues</Typography>
                <FieldArray name="deliveryDates" render={arrayHelpers => (<Stack spacing={1} padding="0 1rem">
                    {values.deliveryDates.map((deliveryDate, idx) => <Stack key={idx} component={Paper} elevation={3} padding="0.5rem">
                        <Stack alignItems="center" direction="row" justifyContent="space-between">
                            <InputLabel>Catégories de produits vendues</InputLabel>
                            {idx > 0 && <IconButton onClick={() => arrayHelpers.remove(idx)}><DeleteIcon/></IconButton>}
                        </Stack>
                        <Stack direction="row">
                            {productCategories.map((cat, catIdx) => {
                                return <FormGroup key={catIdx}>
                                    <FormControlLabel label={cat} control={
                                        <Checkbox disabled={!deliveryDate.productCategories.includes(cat) && !availableCategories.includes(cat)} onClick={() => {
                                            let newValue
                                            
                                            if(deliveryDate.productCategories.includes(cat)){
                                                newValue = deliveryDate.productCategories.filter(selectedCat => selectedCat != cat)
                                            } else {
                                                newValue = [...deliveryDate.productCategories, cat]
                                            }
                                            setFieldValue(`deliveryDates[${idx}].productCategories`, newValue)
                                        }} sx={{padding:'0.25rem'}} size="small" checked={deliveryDate.productCategories.includes(cat)}/>}/>
                                </FormGroup>
                                })}
                        </Stack>
                        <Typography sx={{marginBottom: '0.5rem'}} variant="body1" color="error"><ErrorMessage name={`deliveryDates[${idx}].productCategories`}/></Typography>
                        <DateTimePicker InputProps={{size: 'small'}}
                            label="Début livraisons"
                            onChange={(value) => {
                                setFieldValue(`deliveryDates[${idx}].date`, (value as Dayjs).toDate(), true)
                            }}
                            value={dayjs(deliveryDate.date)}
                            renderInput={(params) => <TextField {...params} />} />
                        <Typography variant="body1" color="error"><ErrorMessage name={`deliveryDates[${idx}].date`} /></Typography>
                    </Stack>)}
                    { availableCategories.length > 0 && <Button onClick={() => arrayHelpers.push({
                        productCategories: availableCategories,
                        date: findNextWeekdayTime(4, 12)
                    })}>Ajouter des catégories de produits</Button>}
                </Stack>)}/>
                <Submit isSubmitting={isSubmitting} label="Nouvelle feuille de quantités" submitError={createQuantitiesSheet.error}/>
            </Stack>
        }}
        </Formik>
    </Paper>
}

export default CreateQuantitiesSheets