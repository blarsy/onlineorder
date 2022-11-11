import { Checkbox, FormControlLabel, Typography } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { Box, Stack } from "@mui/system"
import { DeliveryTime, DeliveryTimes } from "../../lib/common"
import { easyDate, getDeliveryTimeLabel, makePrefCtrlId, DeliveryPrefs } from "../../lib/form/formCommon"

interface Props {
    deliveryTimes: DeliveryTime[],
    touched: FormikTouched<{[id: string]: any}>,
    errors: FormikErrors<{[id: string]: any}>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: {[id: string]: any}
}

const DeliveryPreferenceInput = ({ deliveryTimes, getFieldProps, touched, errors, values } : Props) => {
    const idOfFirstCkeckbox = makePrefCtrlId(deliveryTimes[0].day, deliveryTimes[0].times[0].deliveryTime)
    return <Stack>
        <Typography variant="overline">Préférences de livraison</Typography>
        {
            deliveryTimes.map(dayPrefs => {
                return <Box key={dayPrefs.day.valueOf()} display="flex" alignItems="center" flexWrap="wrap">
                    <Box flex="0 0 3rem">{easyDate(dayPrefs.day)}</Box>
                    {
                        dayPrefs.times.map(dayTime => {
                            const ctrlId = makePrefCtrlId(dayPrefs.day, dayTime.deliveryTime)
                            return <Box flex="0 0 5rem" key={ctrlId}>
                                <FormControlLabel
                                    value="top"
                                    control={<Checkbox {...getFieldProps(ctrlId)}/>}
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
       { Object.keys(touched).length > 0 && errors[idOfFirstCkeckbox] && <Typography color="error" variant="caption">{errors[idOfFirstCkeckbox] as string}</Typography>}
    </Stack>
}

export default DeliveryPreferenceInput