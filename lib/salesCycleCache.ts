import axios from 'axios'
import { SalesCycle } from './common'

let data = null as SalesCycle | null

export const getData = async (): Promise<SalesCycle> => {
    if(data) {
        return data
    }

    const res= await axios.get('/api/orderweek')
    if(res.status === 200){
        data = res.data as SalesCycle
    } else {
        throw new Error(`Request failed with status ${res.status} : ${res.statusText}`)
    }
    return data
}