import Odoo from 'odoo-await'
import { deliveryPrefsToString, NonLocalProductData, OrderData, ProductData } from '../common'
import config from '../serverConfig'

const verbose = false
const productCategories = JSON.parse(process.env.NEXT_PUBLIC_ODOO_PRODUCT_TAGS!) as string[]

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

interface OdooOrderLine {
    product_id : number,
    product_uom_qty: number,
    price_unit: number
}


let connectionPromise: Promise<any> | undefined
export const getOdooConnection = async (): Promise<any> => {
    if(!connectionPromise) {
        const connection = new Odoo(config.connectionInfo)
        connectionPromise = new Promise((resolve, reject) => {
            connection.connect().then(() => resolve(connection))
        })
    }
    return connectionPromise as Promise<any>
}


const tryCreate = async (model: string, object: any): Promise<number> => {
    if(verbose) console.log('create', model, object)
    try {
        const conn = await getOdooConnection()
        const result = await conn.create(model, object)
        if(verbose) console.log('result', result)
        return result
    } catch (e) {
        console.log('Odoo create error', e)
        throw e
    }
}
const tryRead = async (model: string,  filter: any, fields: any): Promise<Array<any>> => {
    if(verbose) console.log('read', model, filter, fields)
    
    try {
        const conn = await getOdooConnection()
        const result = await conn.read(model, filter, fields)
        if(verbose) console.log('result', result)
        return result
    } catch (e) {
        console.log('Odoo read error', e)
        throw e
    }
}
const trySearch = async (model: string, filter: any): Promise<Array<any>> => {
    if(verbose) console.log('search', model, filter)
    try {
        const conn = await getOdooConnection()
        const result = await conn.search(model, filter)
        if(verbose) console.log('result', result)
        return result
    } catch (e) {
        console.log('Odoo search error', e)
        throw e
    }
}
const trySearchRead = async (model: string, filter: any, fields: any ): Promise<Array<any>> => {
    if(verbose) console.log('searchRead', model, filter, fields)
    try {
        const conn = await getOdooConnection()
        const result = await conn.searchRead(model, filter, fields)
        if(verbose) console.log('result', result)
        return result
    } catch (e) {
        console.log('Odoo searchRead error', e)
        throw e
    }
}

export const getProductsForOnlineOrdering = async (): Promise<OdooProductsByCategory> => {
    const outOfCoopCategory = 'Hors Coop'
    const outOfCoopTagIdsPromise = await trySearch(`product.tag`, { name: outOfCoopCategory})
    const tagIds = await trySearch(`product.tag`, { name: productCategories})
    const tagsAndIds = await tryRead('product.tag', tagIds, ['name']) as {id: number, name: string}[]
    const categoryId = {} as {[name: string]: number}
    tagsAndIds.forEach(tagId => categoryId[tagId.name] = tagId.id)

    const products = await trySearchRead('product.product', 
        { product_tag_ids: tagIds },
        ['name', 'product_tag_ids', 'standard_price', 'list_price', 'uom_id']) as Array<any>

    const result = {} as OdooProductsByCategory

    const outOfCoopTagIds = await outOfCoopTagIdsPromise
    productCategories.forEach(cat => {
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
    const tagIds = await trySearch(`product.tag`, { name: productCategories})
    const tagsAndIds = await tryRead('product.tag', tagIds, ['name']) as {id: number, name: string}[]
    const categoryId = {} as {[name: string]: number}
    tagsAndIds.forEach(tagId => categoryId[tagId.name] = tagId.id)

    const excludedTagIds = await trySearch('product.tag', { name: ['Hors Coop'] }) as number[]

    const products = await trySearchRead('product.product', 
        ['&', ['product_tag_ids', 'in', tagIds], ['product_tag_ids', 'not in', excludedTagIds]],
        ['name', 'product_tag_ids', 'standard_price', 'list_price', 'uom_id']) as Array<any>

    const result = {} as OdooProductsByCategory

    productCategories.forEach(cat => {
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
    const categories = ['Producteur', 'Cultures planifiées']
    const tagIds = await trySearch(`res.partner.category`, { name: categories})
    const categoriesAndIds = await tryRead('res.partner.category', tagIds, ['name']) as {name: string,id: number}[]
    const idOfCategory = {} as {[name: string]: number}
    categoriesAndIds.forEach(cat => idOfCategory[cat.name] = cat.id)
    const producersIds = await trySearch('res.partner', { 'category_id': tagIds })

    const producers = await tryRead('res.partner', producersIds, ['name', 'category_id']) as Array<any>
    const result = {} as OdooProducersByCategory
    categories.forEach(category => {
        const categoryId = idOfCategory[category]
        result[category] = producers
            .filter(producer => producer['category_id'].includes(categoryId))
            .map(producer => ({ name: producer.name, id: producer.id }))
    })
    return result
}

export const createOrder= async(order: OrderData, customerId: number, products: ProductData[], nonLocalProducts: NonLocalProductData[]): Promise<number> => {
    const productPrices = {} as {[productId: number]: number}
    products.forEach(product => productPrices[product.id] = product.price)

    const nonLocalProductOrderData = {} as {[productId: number]: {price: number, packaging: number}}
    nonLocalProducts.forEach(product => nonLocalProductOrderData[product.id] = {
        price: product.price,
        packaging: product.packaging
    })

    const orderLinesProducts: OdooOrderLine[] = order.quantities.map(quantity => ({ 
        product_id :quantity.productId,
        product_uom_qty: quantity.quantity,
        price_unit: productPrices[quantity.productId]} as OdooOrderLine))

    orderLinesProducts.push(...order.quantitiesNonLocal.map(quantity => ({
        product_id :quantity.productId,
        product_uom_qty: quantity.quantity * nonLocalProductOrderData[quantity.productId].packaging,
        price_unit: nonLocalProductOrderData[quantity.productId].price} as OdooOrderLine
    )))

    let note = order.note ? `Note client : ${order.note}\n`: ''
    note += deliveryPrefsToString(order.preferredDeliveryTimes)
    
    const orderId = await tryCreate('sale.order', {partner_id: customerId, state: 'sale', payment_term_id: 2, 
        note,
        order_line: {
            action: 'create',
            value: orderLinesProducts
        }})

    return orderId
}