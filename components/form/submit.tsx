import { Button, CircularProgress, Box, Stack, Alert } from "@mui/material"

interface Props {
    isSubmitting: boolean,
    label: string,
    submitError: string,
    disabled?: boolean
}

const Submit = (props: Props) => {
    return <Box display="flex" flexDirection="column" alignItems="center" gap="0.5rem">
        <Button variant="contained" type="submit" disabled={props.isSubmitting || props.disabled}>
            <Stack direction="row">
                {props.isSubmitting && <Box sx={{mr: '0.5rem'}}><CircularProgress size={'1.2rem'} /></Box>}
                <span>{props.label}</span>
            </Stack>
        </Button>
        {props.submitError && <Alert severity="error">{props.submitError}</Alert>}
    </Box>

}

export default Submit