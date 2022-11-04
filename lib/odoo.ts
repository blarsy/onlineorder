import './types.d'
import Odoo from 'odoo-await'
import config from './serverConfig'

export interface OdooProduct {
    name: string,
    price: number,
    unit: string,
    id: number,
    sellPrice: number
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

let connection
const getOdooConnection = async (): Promise<any> => {
    connection = new Odoo(config.connectionInfo)
    
    await connection.connect()
    return connection
}

export const getProductsForOnlineOrdering = async (): Promise<OdooProductsByCategory> => {
    const odoo = await getOdooConnection()
    const categories = ['Légume', 'Aromatique', 'Fruit']
    const tagIds = await odoo.search(`product.tag`, { name: categories})
    const outOfCoopCategory = 'Hors Coop'
    const outOfCoopTagIds = await odoo.search(`product.tag`, { name: outOfCoopCategory})
    const tagsAndIds = await odoo.read('product.tag', tagIds, ['name']) as {id: number, name: string}[]
    const categoryId = {} as {[name: string]: number}
    tagsAndIds.forEach(tagId => categoryId[tagId.name] = tagId.id)

    const products = await odoo.searchRead('product.product', 
        { product_tag_ids: tagIds },
        ['name', 'product_tag_ids', 'standard_price', 'list_price', 'uom_id']) as Array<any>

    const result = {} as OdooProductsByCategory

    categories.forEach(cat => {
        result[cat] = products
            .filter(product => product.product_tag_ids.includes(categoryId[cat]) && !product.product_tag_ids.includes(outOfCoopTagIds[0]))
            .map<OdooProduct>(product => ({
                name: product.name,
                price: product['standard_price'],
                id: product.id,
                sellPrice: product['list_price'],
                unit: product.uom_id[1]
            }))
        result[`${cat} hors coopérative`] = products 
            .filter(product => product.product_tag_ids.includes(categoryId[cat]) && product.product_tag_ids.includes(outOfCoopTagIds[0]))
            .map<OdooProduct>(product => ({
                name: product.name,
                price: product['standard_price'],
                id: product.id,
                sellPrice: product['list_price'],
                unit: product.uom_id[1]
            }))
    })

    return result
}

export const getLocalProductsByCategories = async (): Promise<OdooProductsByCategory> => {
    const odoo = await getOdooConnection()
    const categories = ['Légume', 'Aromatique', 'Fruit']
    const tagIds = await odoo.search(`product.tag`, { name: categories})
    const tagsAndIds = await odoo.read('product.tag', tagIds, ['name']) as {id: number, name: string}[]
    const categoryId = {} as {[name: string]: number}
    tagsAndIds.forEach(tagId => categoryId[tagId.name] = tagId.id)

    const excludedTagIds = await odoo.search('product.tag', { name: ['Hors Coop'] }) as number[]

    const products = await odoo.searchRead('product.product', 
        ['&', ['product_tag_ids', 'in', tagIds], ['product_tag_ids', 'not in', excludedTagIds]],
        ['name', 'product_tag_ids', 'standard_price', 'list_price', 'uom_id']) as Array<any>

    const result = {} as OdooProductsByCategory

    categories.forEach(cat => {
        result[cat] = products 
            .filter(product => product.product_tag_ids.includes(categoryId[cat]))
            .map<OdooProduct>(product => ({
                name: product.name,
                price: product['standard_price'],
                id: product.id,
                sellPrice: product['list_price'],
                unit: product.uom_id[1]
            }))
    })

    return result
}

export const getProducers = async (): Promise<OdooProducersByCategory> => {
    const odoo = await getOdooConnection()

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