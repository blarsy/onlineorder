import { CircularProgress, Alert } from '@mui/material'

type LoaderProps = {
    loading: boolean,
    children: JSX.Element,
    error: string,
    initial: boolean
}

const Loader = (props: LoaderProps) => {
    const {loading, children, error, initial} = props
    if(loading) return <CircularProgress />
    else if (error) return <Alert severity="error">{error.toString()}</Alert>
    else if (!initial) return children
    else return <span/>
}

export default Loader