import { Checkbox, FormControlLabel, Typography } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { Box, Stack } from "@mui/system"
import { OrderData } from "../../lib/common"
import { makePrefCtrlId, OrderPrefs } from "./form/common"

interface Props {
    order: OrderData,
    touched: FormikTouched<OrderPrefs>,
    errors: FormikErrors<OrderPrefs>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: OrderPrefs
}

const week = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const easyDate = (date: Date) => `${week[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`

const DeliveryPreferenceInput = ({ order, getFieldProps, touched, errors, values } : Props) => {
    return <Stack>
        <Typography variant="overline">Préférences de livraison</Typography>
        {
            order.preferredDeliveryTimes.map(dayPrefs => {
                return <Box display="flex" alignItems="center">
                    <label key={dayPrefs.day.valueOf()}>{easyDate(dayPrefs.day)}</label>
                    {
                        dayPrefs.times.map(dayTime => {
                            const ctrlId = makePrefCtrlId(dayPrefs.day, dayTime.deliveryTime)
                            return <Box key={ctrlId}>
                                <FormControlLabel
                                    value="top"
                                    control={<Checkbox
                                        {...getFieldProps(ctrlId)}/>}
                                    label={dayTime.deliveryTime.toString()}
                                    labelPlacement="top"
                                />
                                { touched[ctrlId] && errors[ctrlId] && <Typography color="error" variant="caption">{errors[ctrlId]}</Typography> }
                            </Box>
                        })
                    }
                </Box>
            })
        }
    </Stack>
}

export default DeliveryPreferenceInput