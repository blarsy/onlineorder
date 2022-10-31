import './types.d'
import Odoo from 'odoo-await'

interface OdooProduct {
    name: string,
    price: number,
    unit: string,
    id: number,
    margin: number
}

export interface OdooProducer {
    name: string,
    id: number
}

export interface OdooProductsByCategory {
    [category: string]: Array<OdooProduct>
}

interface OdooProducersByCategory {
    [category: string]: OdooProducer[]
}

const connectionInfo = process.env.ODOO_CONNECTION_INFO ? JSON.parse(process.env.ODOO_CONNECTION_INFO!).connectionInfo : '' as string

let connection
const getOdooConnection = async (providedConnectionInfo?: any): Promise<any> => {
    connection = new Odoo(providedConnectionInfo || connectionInfo)
    
    await connection.connect()
    return connection
}

export const getProductsByCategories = async (providedConnectionInfo?: any): Promise<OdooProductsByCategory> => {
    const odoo = await getOdooConnection(providedConnectionInfo)
    const categories = ['Légume', 'Aromatique', 'Fruit'] as Array<string>
    const tagIds = await odoo.search(`product.tag`, { name: categories})
    const categoriesAndIds = await odoo.read('product.tag', tagIds, ['name']) as Array<{ name: string, id: number}>
    const idOfCategory = {} as {[name: string]: number}
    categoriesAndIds.forEach(catAndId => idOfCategory[catAndId.name] = catAndId.id)
    const productIds = await odoo.search(`product.product`, { 'product_tag_ids': tagIds })
    const products = await odoo.read('product.product', productIds, ['name', 'product_tag_ids', 'standard_price', 'list_price', 'uom_id']) as Array<any>
    const result = {} as {[category: string]: Array<any>}
    for (let i = 0; i < categories.length; i++){
        const categoryId = idOfCategory[categories[i]]
        result[categories[i]]= products
            .filter(product => product.product_tag_ids
            .includes(categoryId)).map(product => ({ 
                name: product.name, 
                price: product['standard_price'], 
                margin: (product['list_price']-product['standard_price']) / product['standard_price'],
                unit: product['uom_id'][1],
                id: product['id']
            }))
    }
    return result
}

export const getProducers = async (providedConnectionInfo?: any): Promise<OdooProducersByCategory> => {
    const odoo = await getOdooConnection(providedConnectionInfo)

    const categories = ['Producteur', 'Cultures planifiées']
    const tagIds = await odoo.search(`res.partner.category`, { name: categories})
    const categoriesAndIds = await odoo.read('res.partner.category', tagIds, ['name']) as {name: string,id: number}[]
    const idOfCategory = {} as {[name: string]: number}
    categoriesAndIds.forEach(cat => idOfCategory[cat.name] = cat.id)
    const producersIds = await odoo.search('res.partner', { 'category_id': tagIds })
    const producers = await odoo.read('res.partner', producersIds, ['name', 'category_id']) as Array<any>
    const result = {} as OdooProducersByCategory
    categories.forEach(category => {
        const categoryId = idOfCategory[category]
        result[category] = producers
            .filter(producer => producer['category_id'].includes(categoryId))
            .map(producer => ({ name: producer.name, id: producer.id }))
    })
    return result
}