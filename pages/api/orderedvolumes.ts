import { NextApiRequest, NextApiResponse } from "next";
import { OrderedVolumes } from "../../lib/common";
import { handleException } from "../../lib/request";
import { getOrderVolumes } from "../../lib/data/volumesFile";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<OrderedVolumes | { error: string }>
  ) {
    if(req.method === 'GET') {
        try {
            const volumes = await getOrderVolumes()
            res.status(200).json(volumes)
        } catch (e) {
            handleException(e, res)
        }
    } else {
        res.status(501).end()
    }
}