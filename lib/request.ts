import { NextApiResponse } from "next"
import { errorToString } from "./common"

export const handleException = (exception: any, res: NextApiResponse):void => {
    res = res.status(500)
    res.json({ error: errorToString(exception) })
}