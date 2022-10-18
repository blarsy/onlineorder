import { Checkbox, FormControlLabel, Typography } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { Box, Stack } from "@mui/system"
import { OrderData } from "../lib/common"
import { easyDate, getDeliveryTimeLabel, makePrefCtrlId, OrderPrefs } from "../lib/formCommon"

interface Props {
    order: OrderData,
    touched: FormikTouched<OrderPrefs>,
    errors: FormikErrors<OrderPrefs>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: OrderPrefs
}

const DeliveryPreferenceInput = ({ order, getFieldProps, touched, errors, values } : Props) => {
    const idOfFirstCkeckbox = makePrefCtrlId(order.preferredDeliveryTimes[0].day, order.preferredDeliveryTimes[0].times[0].deliveryTime)
    return <Stack>
        <Typography variant="overline">Préférences de livraison</Typography>
        {
            order.preferredDeliveryTimes.map(dayPrefs => {
                return <Box key={dayPrefs.day.valueOf()} display="flex" alignItems="center" flexWrap="wrap">
                    <Box flex="0 0 3rem">{easyDate(dayPrefs.day)}</Box>
                    {
                        dayPrefs.times.map(dayTime => {
                            const ctrlId = makePrefCtrlId(dayPrefs.day, dayTime.deliveryTime)
                            return <Box flex="0 0 5rem" key={ctrlId}>
                                <FormControlLabel
                                    value="top"
                                    control={<Checkbox
                                        {...getFieldProps(ctrlId)}/>}
                                    checked={values[ctrlId]}
                                    label={getDeliveryTimeLabel(dayTime.deliveryTime)}
                                    labelPlacement="top"
                                />
                            </Box>
                        })
                    }
                </Box>
            })
        }
       { Object.keys(touched).length > 0 && errors[idOfFirstCkeckbox] && <Typography color="error" variant="caption">{errors[idOfFirstCkeckbox]}</Typography>}
    </Stack>
}

export default DeliveryPreferenceInput