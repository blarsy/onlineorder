import { NextApiResponse } from "next"

export const handleException = (exception: any, res: NextApiResponse):void => {
    res = res.status(500)
    if(typeof(exception) === 'object') {
        res.json({ error: JSON.stringify(exception) })
    } else if(exception instanceof Error) {
        res.json({ error : exception.message })
    } else {
        res.json({ error : exception.toString() })   
    }
}