import type { NextApiRequest, NextApiResponse } from 'next'
import { handleException } from '../../lib/request'
import { TaskLogEntry, TaskStatus } from '../../lib/common'
import queue from '../../lib/tasksQueue/queue'

type Data = {
  tasks?: TaskLogEntry[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    if(req.method === 'GET') {
        try {
            const response = { tasks: queue.tasks.map(task => {
                const lastLog = task.lastLog()
                return { 
                    name: task.name, 
                    date: lastLog.date,
                    status: lastLog.status, 
                    error: lastLog.error
                }}) 
            }
            res.status(200).json(response)
        } catch(e) {
            handleException(e, res)
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
}
