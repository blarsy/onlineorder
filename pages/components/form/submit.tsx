import { Button, CircularProgress, Box, Stack, Alert } from "@mui/material"
import { useState, useEffect } from 'react'

interface Props {
    isSubmitting: boolean,
    label: string,
    submitError: string
}

const Submit = (props: Props) => {
    const [pristine, setPristine] = useState(true)
    useEffect(() => {
        if(props.isSubmitting && pristine) {
            setPristine(false)
        }
    }, [props.isSubmitting])

    return <Box>
        <Button variant="contained" type="submit" disabled={props.isSubmitting}>
            <Stack direction="row">
                {props.isSubmitting && <Box sx={{mr: '0.5rem'}}><CircularProgress size={'1.2rem'} /></Box>}
                <span>{props.label}</span>
            </Stack>
        </Button>
        {props.submitError && <Alert severity="error">{props.submitError}</Alert>}
        {!pristine && !props.isSubmitting && !props.submitError && <Alert severity="success">Terminé !</Alert>}
    </Box>

}

export default Submit