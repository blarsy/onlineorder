import { NextApiRequest, NextApiResponse } from "next"
import { CustomerData, OrderData } from "../../lib/common"
import { getOrder, saveOrder } from "../../lib/orderFile"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ error: string} | OrderData | null>
  ) {
    if(req.method === 'PUT') {
        try {
            const orderData = req.body.order as OrderData
            if(!orderData) {
                res.status(500).json({ error: 'Order data must be present, and must contain order data.' })
            }
            await saveOrder(orderData, req.body.slug, Number(req.body.targetWeek.weekNumber), Number(req.body.targetWeek.year))
            res.status(200).json(null)
        } catch(e) {
            res.status(500).json({ error: (e as Error).toString() })
        }
    } else if (req.method === 'GET') {
        try {
            const order = await getOrder(Number(req.query.weeknumber), Number(req.query.year), req.query.slug as string)
            res.status(200).json(order || null)
        } catch (e) {
            console.log(e)
            res.status(500).json({ error: (e as Error).toString() })
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
  }