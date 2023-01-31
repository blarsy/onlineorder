import { utils } from "ethers"
import { NextApiRequest, NextApiResponse } from "next"
import { OrderCustomer, OrderData } from "../../lib/common"
import { createErpOrder } from "../../lib/data/erpOrder"
import { getOrder, saveOrder, getOrderCustomers } from "../../lib/data/orderFile"
import { handleException } from "../../lib/request"
import config from '../../lib/serverConfig'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ error: string} | OrderData | OrderCustomer[] | { orderIds: number[] } | null>
  ) {
    if(req.method === 'PUT') {
        try {
            const orderData = req.body.order as OrderData
            if(!orderData) {
                res.status(500).json({ error: 'Order data must be present, and must contain order data.' })
            } else if (!req.body.deadline || isNaN(new Date(req.body.deadline).getTime())) {
                res.status(500).json({ error: 'Missing or invalid deadline date.' })
            } else {
                const savedOrder = await saveOrder(orderData, req.body.slug, new Date(req.body.deadline).toISOString())
                res.status(200).json(savedOrder)
            }
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'PATCH') {
        try {
            if(!req.body.slug) {
                res.status(500).json({error: 'Missing slug'})
            } else {
                const signerAddress = utils.verifyMessage(req.body.message, req.body.signature)
                if(!config.authorizedSigners.find(authorizedSigner => authorizedSigner === signerAddress)){
                    res.status(500).json({ error: 'Unauthorized' })
                } else {
                    const orderIds = await createErpOrder(req.body.slug)
                    res.status(200).json({ orderIds })
                }
            }
        } catch(e) {
            handleException(e, res)
        }
    } else if (req.method === 'GET') {
        if(req.query.deadline && req.query.slug) {
            try {
                const order = await getOrder(new Date(req.query.deadline as string).toISOString(), req.query.slug as string)
                res.status(200).json(order?.order || null)
            } catch (e) {
                handleException(e, res)
            }
        } else {
            if(req.query.deadline) {
                try {
                    const orderCustomers = await getOrderCustomers(new Date(req.query.deadline as string).toISOString())
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
