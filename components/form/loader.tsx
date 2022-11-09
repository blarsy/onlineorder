import { CircularProgress, Alert } from '@mui/material'

type LoaderProps = {
    loading: boolean,
    children: JSX.Element,
    error: string
}

const Loader = (props: LoaderProps) => {
    const {loading, children, error} = props
    if(loading) return <CircularProgress />
    else if (error) return <Alert severity="error">{error.toString()}</Alert>
    else return children
}

export default Loader