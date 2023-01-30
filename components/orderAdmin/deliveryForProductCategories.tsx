import { DateTimePicker } from "@mui/x-date-pickers"
import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, InputLabel, Paper, Stack, TextField, TextFieldProps, Typography } from "@mui/material"
import dayjs, { Dayjs } from "dayjs"
import { ErrorMessage } from "formik"
import DeleteIcon from '@mui/icons-material/Delete'
import { DeliveryTimes, easyDate, getDeliveryTimeLabel } from "../../lib/common"
import { addWorkingDays } from "../../lib/dateWeek"
import { DeliveryScheme, Values } from "./createCampaign"

const productCategories = JSON.parse(process.env.NEXT_PUBLIC_ODOO_PRODUCT_TAGS!) as string[]

const allDeliveryTimes = [DeliveryTimes.h8, DeliveryTimes.h9, DeliveryTimes.h10, DeliveryTimes.h11, 
    DeliveryTimes.h12, DeliveryTimes.h13, DeliveryTimes.h14, DeliveryTimes.h15, DeliveryTimes.h16]
    
interface Props {
    fieldName: string
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void
    value: DeliveryScheme
    canRemove: boolean
    onRemove: () => void
    availableCategories: string[]
}

const DeliveryForProductCategories = ({ fieldName, setFieldValue, value, canRemove, onRemove, availableCategories }: Props) => {
    return <Stack spacing={1} padding="0.5rem" component={Paper} elevation={4}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
            <InputLabel>Catégories de produits vendues</InputLabel>
            {canRemove && <IconButton onClick={onRemove}><DeleteIcon/></IconButton>}
        </Stack>
        <Stack direction="row">
        {productCategories.map((cat, idx) => {
            return <FormGroup key={idx}>
                <FormControlLabel label={cat} control={
                    <Checkbox disabled={!value.productCategories.includes(cat) && !availableCategories.includes(cat)} onClick={() => {
                        let newValue
                        const productCategories = value.productCategories
                        if(productCategories.includes(cat)){
                            newValue = productCategories.filter(selectedCat => selectedCat != cat)
                        } else {
                            newValue = [...productCategories, cat]
                        }
                        setFieldValue(`${fieldName}.productCategories`, newValue)
                    }} sx={{padding:'0.25rem'}} size="small" checked={value.productCategories.includes(cat)}/>}/>
            </FormGroup>
            })}
        </Stack>
        <Typography sx={{marginBottom: '0.5rem'}} variant="body1" color="error"><ErrorMessage name={`${fieldName}.productCategories`}/></Typography>
        <DateTimePicker InputProps={{size: 'small'}}
            label="Début livraisons"
            onChange={(value) => {
                setFieldValue(`${fieldName}.delivery`, (value as Dayjs).toDate(), true)
            }}
            value={dayjs(value.delivery)}
            renderInput={(params: TextFieldProps) => <TextField {...params} />}
        />
        <Typography variant="body1" color="error"><ErrorMessage name={`${fieldName}.delivery`} /></Typography>
        <InputLabel>Horaires de livraisons</InputLabel>
        {[1, 2, 3].map(dayNumber => {
            return <Box key={dayNumber} display="flex" alignItems="center" flexWrap="wrap">
                <Box flex="0 0 3rem">{easyDate(addWorkingDays(value.delivery, dayNumber - 1))}</Box>
                {allDeliveryTimes.map(deliveryTime => {
                    const ctrlId = `${dayNumber}-${deliveryTime.toString()}`
                    return <Box flex="0 0 5rem" key={ctrlId}>
                        <FormControlLabel
                            value="top"
                            control={<Checkbox sx={{padding:0}} name={ctrlId}
                                checked={value.deliveryTimes[ctrlId]} onChange={(e, val) => {
                                    setFieldValue(`${fieldName}.deliveryTimes.${ctrlId}`, val)
                                }}/>}
                            checked={value.deliveryTimes[ctrlId] as boolean}
                            label={getDeliveryTimeLabel(deliveryTime)}
                            labelPlacement="top" />
                    </Box>})
                }
            </Box>
        })}
        <Typography variant="body1" color="error"><ErrorMessage name={`${fieldName}.deliveryTimes`} /></Typography>
    </Stack>
}

export default DeliveryForProductCategories