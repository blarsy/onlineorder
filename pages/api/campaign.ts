import type { NextApiRequest, NextApiResponse } from 'next'
import { utils } from 'ethers'
import { createDataFile, getDataFileContent, updateCustomers, updateProducts } from '../../lib/dataFile'
import { handleException } from '../../lib/request'
import config from '../../lib/serverConfig'

type Data = {
  error: string
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
                if(!req.body.delivery || isNaN(new Date(req.body.delivery).getTime()) || new Date(req.body.delivery) < new Date() ){
                    res.status(500).json({ error: 'Invalid or missing delivery date' })
                } else if (!req.body.deadline || isNaN(new Date(req.body.deadline).getTime())){
                    res.status(500).json({ error: 'Invalid or missing deadline' })
                } else if (!req.body.deliveryTimes || !req.body.deliveryTimes.length || req.body.deliveryTimes.length === 0 ) {
                    res.status(500).json({ error: 'Invalid or missing delivery times' })
                } else if (!req.body.sheetId || isNaN(Number(req.body.sheetId)) ) {
                    res.status(500).json({ error: 'Invalid or missing sheetId' })
                }{
                    await createDataFile(new Date(req.body.delivery), new Date(req.body.deadline), req.body.sheetId, req.body.deliveryTimes)
                    res.status(200).json({ error: '' })
                }
            }
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'GET') {
        try {
            const file = await getDataFileContent()
            if(!file){
                res.status(500).json({ error: 'No campaign found' })
            }
            res.status(200).json(JSON.parse(file))
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
                    await updateCustomers()
                    res.status(200).json({error: ''})
                } catch (e) {
                    handleException(e, res)
                }
            } else if(req.body.products) {
                if(!req.body.sheetId) {
                    res.status(500).json({ error: 'Missing source sheet Id'})
                } else {
                    try {
                        await updateProducts(req.body.sheetId)
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
