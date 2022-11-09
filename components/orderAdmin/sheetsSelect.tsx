import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import axios from 'axios'
import { ErrorMessage, FieldInputProps } from 'formik'
import { useState, useEffect } from 'react'
import Loader from '../form/loader'

interface Props {
    fieldProps: FieldInputProps<string | null>
}

const SheetsSelect = ({ fieldProps }: Props) => {
    const [sheets, setSheets]= useState({loading: false, error: '', sheets: null as {id: number, title: string}[] | null})
    useEffect(() => {
        const loadSheets = async () => {
            try {
                setSheets({ loading: true, error: '', sheets: null })
                const res = await axios.get('/api/sheets')
                setSheets({ loading: false, error: '', sheets: res.data as {id: number, title: string}[]})
            } catch(e: any) {
                setSheets({ loading: false, error: e.toString(), sheets: null })
            }
        }
        loadSheets()
    }, [])
    return (<Loader loading={sheets.loading} error={sheets.error}>
        <FormControl>
            <InputLabel id="labelsheet">Source</InputLabel>
            <Select
                { ...fieldProps}
                labelId="labelsheet"
                label="Source">
                {
                    sheets.sheets && sheets.sheets.map(sheet => <MenuItem key={sheet.id} value={sheet.id}>{sheet.title}</MenuItem>)
                }
            </Select>
            <Typography variant="body1" color="error"><ErrorMessage name={fieldProps.name} /></Typography>
        </FormControl>
    </Loader>)
}

export default SheetsSelect