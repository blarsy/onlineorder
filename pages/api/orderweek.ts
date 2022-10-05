// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { createDataFile } from '../../lib/dataFile'

type Data = {
  error: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    return new Promise(async resolve => {
        if(req.method === 'PUT') {
            try {
                createDataFile()
                res.status(200).json({ error: '' })
            } catch(e) {
                res.status(500).json({ error: e as string })
            }
        } else {
            res.status(501).end()
            resolve({ error: 'Unexpected method'})
        }
    })
}
