import { NextApiResponse } from "next"

export const handleException = (exception: any, res: NextApiResponse):void => {
    res = res.status(500)
    if(exception instanceof Error) {
        res.json({ error : { message: exception.message, stack: exception.stack} })
    } else if(typeof(exception) === 'object') {
        res.json({ error: JSON.stringify(exception) })
    } else {
        res.json({ error : exception.toString() })   
    }
}