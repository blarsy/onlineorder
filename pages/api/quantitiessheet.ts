import { utils } from "ethers"
import { NextApiRequest, NextApiResponse } from "next"
import { createBlankQuantitiesSheet } from "../../lib/productQuantitiesSheet"
import { handleException } from "../../lib/request"

interface Response {
    error: string
}

const authorizedSigners = JSON.parse(process.env.AUTHORIZED_SIGNERS!) as string[]

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>
  ) {
        if(req.method === 'PUT') {
            try {
                const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
                if(!authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                    res.status(500).json({ error: 'Unauthorized' })
                } else {
                    if(!req.body.delivery || isNaN(new Date(req.body.delivery).getTime()) || new Date(req.body.delivery) < new Date()){
                        res.status(500).json({ error: 'Invalid or missing delivery date' })
                    } else {
                        await createBlankQuantitiesSheet(new Date(req.body.delivery))
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
  