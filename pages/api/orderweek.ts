// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { utils } from 'ethers'
import { createDataFile, getDataFileContent } from '../../lib/dataFile'
import { isCurrentOrNextWeekNumber } from '../../lib/dateWeek'

type Data = {
  error: string
}

const authorizedSigners = JSON.parse(process.env.AUTHORIZED_SIGNERS!) as string[]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    if(req.method === 'PUT') {
        try {
            const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
            if(!authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                res.status(500).json({ error: 'Unauthorized' })
            } else {
                if(!req.body.weekNumber || !isCurrentOrNextWeekNumber(req.body.weekNumber)){
                    res.status(500).json({ error: 'Invalid or missing weekNumber' })
                } else {
                    await createDataFile(req.body.weekNumber, req.body.year)
                    res.status(200).json({ error: '' })
                }
            }
        } catch(e) {
            res.status(500).json({ error: (e as Error).toString() })
        }
    } else if (req.method === 'GET') {
        try {
            const file = await getDataFileContent()
            res.status(200).json(JSON.parse(file))
        } catch (e) {
            console.log(e)
            res.status(500).json({ error: (e as Error).toString() })
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
}
