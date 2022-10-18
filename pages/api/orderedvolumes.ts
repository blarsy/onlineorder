import { NextApiRequest, NextApiResponse } from "next";
import { OrderedVolumes } from "../../lib/common";
import { getOrderVolumes } from "../../lib/volumesFile";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<OrderedVolumes | { error: string }>
  ) {
    if(req.method === 'GET') {
        try {
            const volumes = await getOrderVolumes()
            res.status(200).json(volumes)
        } catch (e: any) {
            console.log(e)
            res.status(500).json({ error: e.toString() })
        }
    } else {
        res.status(501).end()
    }
}