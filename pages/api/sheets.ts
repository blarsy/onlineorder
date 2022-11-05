import type { NextApiRequest, NextApiResponse } from 'next'
import { connectSpreadsheet } from '../../lib/google'
import { handleException } from '../../lib/request'
import config from '../../lib/serverConfig'

type Data = { error: string } | { id: string, title: string }[]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    if(req.method === 'GET') {
        try {
            const sheets = await connectSpreadsheet(config.googleSheetIdProducts)
            await sheets.loadInfo()

            res.status(200).json(Object.keys(sheets.sheetsById).map(id => ({
                id, title: sheets.sheetsById[id].title
            })))
        } catch(e) {
            handleException(e, res)
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
}
