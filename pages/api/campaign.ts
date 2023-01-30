import type { NextApiRequest, NextApiResponse } from 'next'
import { utils } from 'ethers'
import { createDataFile, getDataFileContent, updateCustomers, updateProducts } from '../../lib/data/dataFile'
import { handleException } from '../../lib/request'
import config from '../../lib/serverConfig'
import queue from '../../lib/tasksQueue/queue'
import Task from '../../lib/tasksQueue/task'
import { DeliveryScheme, SalesCycle } from '../../lib/common'
import { TaskNames } from '../../lib/form/formCommon'

type Data = {
  error: string
} | SalesCycle

const validateDeliverySchemes = (deliverySchemes: any[]): string => {
    for(const scheme of deliverySchemes) {
        if(!scheme.delivery || isNaN(new Date(scheme.delivery).getTime()) || new Date(scheme.delivery) < new Date() ) {
            return 'A delivery date is missing of invalid'
        } else if(!scheme.deliveryTimes || !scheme.deliveryTimes.length || scheme.deliveryTimes.length === 0){
            return 'MIssing delivery hours'
        } else if(!scheme.productCategories || scheme.productCategories.length === 0) {
            return 'Missing product category: at least one should be provided'
        }
    }
    return ''
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    if(req.method === 'PUT') {
        try {
            const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
            if(!config.authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                res.status(500).json({ error: 'Unauthorized' })
            } else {
                if (!req.body.sheetId || isNaN(Number(req.body.sheetId)) ) {
                    res.status(500).json({ error: 'Invalid or missing sheetId' })
                } else if (!req.body.deadline || isNaN(new Date(req.body.deadline).getTime())){
                    res.status(500).json({ error: 'Invalid or missing deadline' })
                } else if (!req.body.deliverySchemes || req.body.deliverySchemes.length === 0) {
                    res.status(500).json({ error: 'Missing delivery schemes' })
                } else {
                    const schemesError = validateDeliverySchemes(req.body.deliverySchemes)
                    if(schemesError) {
                        res.status(500).json({ error: schemesError })
                    } else {
                        console.log(req.body)
                        queue.enqueue(
                            new Task([new Date(req.body.deadline), req.body.sheetId, req.body.deliverySchemes], 
                            async (args: any[]) => {
                                await createDataFile(args[0] as Date, args[1] as number, args[2] as DeliveryScheme[])
                            }, TaskNames.CreateCampaign))
                        res.status(200).json({ error: '' })
                    }
                }
            }
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'GET') {
        try {
            res.status(200).json(await getDataFileContent())
        } catch (e) {
            handleException(e, res)
        }
    } else if (req.method === 'PATCH') {
        const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
        if(!config.authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
            res.status(500).json({ error: 'Unauthorized' })
        } else {
            if(req.body.customers) {
                try {
                    queue.enqueue(
                        new Task([], 
                        async (args: any[]) => {
                            await updateCustomers()
                        }, TaskNames.UpdateCustomers))
                    res.status(200).json({error: ''})
                } catch (e) {
                    handleException(e, res)
                }
            } else if(req.body.products) {
                if(!req.body.sheetId) {
                    res.status(500).json({ error: 'Missing source sheet Id'})
                } else {
                    try {
                        queue.enqueue(
                            new Task([req.body.sheetId], 
                            async (args: any[]) => {
                                await updateProducts(args[0] as number)
                            }, TaskNames.UpdateProducts))
                        res.status(200).json({error: ''})
                    } catch (e) {
                        handleException(e, res)
                    }
                }
            }
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
}
