import { utils } from "ethers"
import { NextApiRequest, NextApiResponse } from "next"
import { createBlankQuantitiesSheet } from "../../lib/data/productQuantitiesSheet"
import { TaskNames } from "../../lib/form/formCommon"
import { handleException } from "../../lib/request"
import config from '../../lib/serverConfig'
import queue from '../../lib/tasksQueue/queue'
import Task from "../../lib/tasksQueue/task"

interface Response {
    error: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>
  ) {
        if(req.method === 'PUT') {
            try {
                const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
                if(!config.authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                    res.status(500).json({ error: 'Unauthorized' })
                } else {
                    if(!req.body.delivery || isNaN(new Date(req.body.delivery).getTime()) || new Date(req.body.delivery) < new Date()){
                        res.status(500).json({ error: 'Invalid or missing delivery date' })
                    } else if(!req.body.deadline || isNaN(new Date(req.body.deadline).getTime()) 
                        || new Date(req.body.deadline) < new Date() || new Date(req.body.deadline) > new Date(req.body.delivery)){
                        res.status(500).json({ error: 'Invalid or missing deadline date' })
                    } else if(!req.body.sheetId || isNaN(Number(req.body.sheetId))) {
                        res.status(500).json({ error: 'Invalid or missing sheetId' })
                    } else {
                        queue.enqueue(
                            new Task([new Date(req.body.delivery), new Date(req.body.deadline), req.body.sheetId], 
                            async (args: any[]) => {
                                await createBlankQuantitiesSheet(args[0] as Date, args[1] as Date, args[2] as number)
                            }, 
                            TaskNames.CreateQuantitiesSheet))
                        res.status(200).json({ error: '' })
                    }
                }
            } catch(e) {
                handleException(e, res)
            }
        } else {
            res.status(501).json({ error: 'Unexpected method'})
        }
    }
  