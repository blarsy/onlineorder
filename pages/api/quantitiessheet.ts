import { utils } from "ethers"
import { NextApiRequest, NextApiResponse } from "next"
import { DeliveryDate, InputDeliveryDate } from "../../lib/common"
import { createBlankQuantitiesSheet, updateQuantitiesSheet } from "../../lib/data/productQuantitiesSheet"
import { TaskNames } from "../../lib/form/formCommon"
import { handleException } from "../../lib/request"
import config from '../../lib/serverConfig'
import queue from '../../lib/tasksQueue/queue'
import Task from "../../lib/tasksQueue/task"

interface Response {
    error: string
}

const validateDeliveryDates = (deliveryDates: InputDeliveryDate[], deadline: Date): string => {
    for(const deliveryDate of deliveryDates) {
        if(!deliveryDate.productCategories || deliveryDate.productCategories.length === 0) {
            return 'Missing product category: there should be at least one.'
        } else if (!deliveryDate.date || isNaN(new Date(deliveryDate.date).getTime()) || new Date(deliveryDate.date) < deadline){
            return 'Missing or invalid delivery date.'
        } 
    }
    return ''
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
                    if(!req.body.deadline || isNaN(new Date(req.body.deadline).getTime()) 
                        || new Date(req.body.deadline) < new Date()){
                        res.status(500).json({ error: 'Invalid or missing deadline date' })
                    } else {
                        if(!req.body.deliveryDates || req.body.deliveryDates.length === 0) {
                            res.status(500).json({ error: 'Missing delivery dates' })
                        } else {
                            const deliveryDatesError = validateDeliveryDates(req.body.deliveryDates, new Date(req.body.deadline))
                            if (deliveryDatesError) {
                                res.status(500).json({ error: deliveryDatesError })
                            } else {
                                const typedDeliveryDates = req.body.deliveryDates.map((deliveryDate: InputDeliveryDate) => (<DeliveryDate>{
                                    date: new Date(deliveryDate.date),
                                    productCategories: deliveryDate.productCategories
                                }))
                                queue.enqueue(
                                    new Task([typedDeliveryDates, new Date(req.body.deadline), req.body.sheetId], 
                                    async (args: any[]) => {
                                        await createBlankQuantitiesSheet(args[0] as DeliveryDate[], args[1] as Date, args[2] as number)
                                    }, 
                                    TaskNames.CreateQuantitiesSheet))
                                res.status(200).json({ error: '' })
                            }
                        }
                    }
                }
            } catch(e) {
                handleException(e, res)
            }
        } else if(req.method === 'PATCH') {
            try {
                const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
                if(!config.authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                    res.status(500).json({ error: 'Unauthorized' })
                } else {
                    if(!req.body.sheetId || isNaN(Number(req.body.sheetId))) {
                        res.status(500).json({ error: 'Invalid or missing sheetId' })
                    } else {
                        queue.enqueue(
                            new Task([req.body.sheetId], 
                            async (args: any[]) => {
                                await updateQuantitiesSheet(args[0] as number)
                            }, 
                            TaskNames.UpdateQuantitiesSheet))
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
  