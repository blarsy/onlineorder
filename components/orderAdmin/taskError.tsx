import { useState } from 'react'
import { Box, Popover, Typography } from "@mui/material"
import Error from '@mui/icons-material/Error'

interface Props {
    error: string
}

const TaskError = ({ error }: Props) => {
    const [anchorEl, setAnchorEl] = useState(null as Element | null)
    return (<Box>
        <Error color="error" onClick={(e) => setAnchorEl(e.currentTarget)}/>
        <Popover
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}>
            <Typography sx={{ p: 2 }}>{error}</Typography>
        </Popover>
    </Box>)
}

export default TaskError