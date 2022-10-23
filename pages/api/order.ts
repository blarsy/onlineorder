import { NextApiRequest, NextApiResponse } from "next"
import { OrderCustomer, OrderData } from "../../lib/common"
import { getOrder, saveOrder, getOrderCustomers } from "../../lib/orderFile"
import { handleException } from "../../lib/request"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ error: string} | OrderData | OrderCustomer[] | null>
  ) {
    if(req.method === 'PUT') {
        try {
            const orderData = req.body.order as OrderData
            if(!orderData) {
                res.status(500).json({ error: 'Order data must be present, and must contain order data.' })
            }
            const savedOrder = await saveOrder(orderData, req.body.slug, Number(req.body.targetWeek.weekNumber), Number(req.body.targetWeek.year))
            res.status(200).json(savedOrder)
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'GET') {
        if(req.query.weeknumber && req.query.year && req.query.slug) {
            try {
                const order = await getOrder(Number(req.query.weeknumber), Number(req.query.year), req.query.slug as string)
                res.status(200).json(order?.order || null)
            } catch (e) {
                handleException(e, res)
            }
        } else {
            if(req.query.weeknumber && req.query.year) {
                try {
                    const orderCustomers = await getOrderCustomers(Number(req.query.weeknumber), Number(req.query.year))
                    res.status(200).json(orderCustomers)
                } catch (e) {
                    handleException(e, res)
                }
            } else {
                res.status(422).json({ error : 'missing parameters'})
            }
        }
    } else {
        res.status(501).json({ error: 'Unexpected method'})
    }
  }