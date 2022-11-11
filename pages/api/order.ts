import { NextApiRequest, NextApiResponse } from "next"
import { OrderCustomer, OrderData } from "../../lib/common"
import { getOrder, saveOrder, getOrderCustomers } from "../../lib/data/orderFile"
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
            } else if (!req.body.delivery || isNaN(new Date(req.body.delivery).getTime())) {
                res.status(500).json({ error: 'Missing or invalid delivery date.' })
            } else {
                const savedOrder = await saveOrder(orderData, req.body.slug, new Date(req.body.delivery))
                res.status(200).json(savedOrder)
            }
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'GET') {
        if(req.query.delivery && req.query.slug) {
            try {
                const order = await getOrder(new Date(req.query.delivery as string), req.query.slug as string)
                res.status(200).json(order?.order || null)
            } catch (e) {
                handleException(e, res)
            }
        } else {
            if(req.query.delivery) {
                try {
                    const orderCustomers = await getOrderCustomers(new Date(req.query.delivery as string))
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