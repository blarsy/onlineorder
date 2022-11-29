import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { TaskLogEntry, TaskStatus, easyDateTime } from '../../lib/common'
import TaskError from './taskError'

const taskStatusToString = (status: TaskStatus) => {
    switch(status) {
        case TaskStatus.created:
            return 'Créée'
        case TaskStatus.executing:
            return 'Execution'
        case TaskStatus.finished:
            return 'Terminée'
    }
}

const Tasks = () => {
    const [tasks, setTasks] = useState([] as TaskLogEntry[])

    useEffect(() => {
        const timerId = window.setInterval(async () => {
            try {
                const res = await axios.get('/api/tasks')
                setTasks(res.data.tasks)
            } catch(e) { 
                // swallow
            }
        }, 2000)

        return () => {
            window.clearInterval(timerId)
        }
    }, [])

    if(tasks.length > 0) {
        return <Box alignSelf="stretch">
            <Stack flexWrap="wrap" flexDirection="row" margin="0.5rem 0" sx={{boxShadow:'inset 0 0 3px black', padding: '0.5rem'}}>
                {tasks.map((task, idx) => ([
                    <Typography variant="body2" flex="1 0 50%" key={`${idx}-col1`}>{task.name}</Typography>,
                    <Typography variant="body2" flex="1 0 20%" key={`${idx}-col2`}>{easyDateTime(new Date(task.date))}</Typography>,
                    <Typography variant="body2" flex="1 0 20%" key={`${idx}-col3`}>{taskStatusToString(task.status)}&nbsp;{task.status === TaskStatus.executing && <CircularProgress size="1rem"/>}</Typography>,
                    <Typography variant="body2" flex="1 0 10%" key={`${idx}-col4`}>{task.error && <TaskError error={task.error} />
                    }</Typography>,
                ]))}
            </Stack>
        </Box>
    }
    return <div/>

}

export default Tasks