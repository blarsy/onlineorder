import { XmlRpcClient } from '@foxglove/xmlrpc'

interface ConnectionOptions {
    url: string,
    db: string,
    username: string,
    password: string
}
interface ManyFieldsParams {
    [field: string]: {
        action: string,
        value: string,
        id: number | Array<number>
    } | Array<any>
}

export default class OdooXmlRpc {
    db: string
    username: string
    password: string
    uid: number
    url: string

  constructor (opts: ConnectionOptions) {

    let defaults = {
      url: 'http://localhost',
      db: 'odoo_db',
      username: 'admin',
      password: 'admin'
    } as ConnectionOptions

    const options = opts ? Object.assign(defaults, opts) : defaults

    this.db = options.db
    this.username = options.username
    this.password = options.password
    this.uid = 0
    this.url = options.url
  }

  async connect(): Promise<number>{
    const client = new XmlRpcClient(this.url + '/xmlrpc/2/common')

    this.uid = (await client.methodCall('authenticate', [this.db, this.username, this.password, {}])) as number
    return this.uid
  }

  execute_kw(model: string, method: string, params: Array<any>): Promise<any> {
    params.unshift( this.db, this.uid, this.password, model, method)
    const client = new XmlRpcClient(this.url + '/xmlrpc/2/object')
    return client.methodCall('execute_kw', params)
  }

  /**
   * Private function for checking for many2many / one2many fields
   * Searches for values that have the "action" property
   * If "action" property is found, we assume it's a many2many / many2one field,
   * and processes as such.
   * If no "action" property is found, we just return the parameter as it was
   * received.
   * @param params
   * @returns {*}
   */
  parseManyFields(params: ManyFieldsParams): ManyFieldsParams{
    for (const [key, val] of Object.entries(params)) {
      if(!Array.isArray(val) && val.action){
        switch(val.action){
          case 'create': // creates records and adds them to the set
            if(!val.value){ throw new Error('\'create\' action requires a value object or an array of value objects') }
            params[key] = Array.isArray(val.value) ?  val.value.map((value) => { return [0, 0, value] }) : [[0, 0, val.value]]
            break
          case 'update': // updates an existing record with new values
            if(!val.id || !val.value){ throw new Error('\'update\' action requires both an ID number and a value object') }
            params[key] = [[1, val.id, val.value]]
            break
          case 'add': // adds an existing record to the set
            if(!val.id){ throw new Error('\'add\' action requires an ID or array of ID\'s to add to add to the set') }
            params[key] = Array.isArray(val.id) ?  val.id.map((id) => { return [4, id, 0] }) : [[4, val.id, 0]]
            break
          case 'remove': // removes the record of ID from the set. Does not delete it from the database
            if(!val.id){ throw new Error('\'remove\' action requires an ID or array of ID\'s to remove from the set') }
            params[key] = Array.isArray(val.id) ?  val.id.map((id) => { return [3, id, 0] }) : [[3, val.id, 0]]
            break
          case 'delete': // removes the record of ID from the set, and deletes it from the database.
            if(!val.id){ throw new Error('\'delete\' action requires an ID or array of ID\'s to delete') }
            params[key] = Array.isArray(val.id) ?  val.id.map((id) => { return [2, id, 0] }) : [[2, val.id, 0]]
            break
          case 'clear': // removes all records from the set, but does not delete them from the database.
            params[key] = [[5, 0, 0]]
            break
          case 'replace': // replaces all existing records in the set by the ids list, equivalent to using 'clear' and then 'add' on every id in the list
            if(!val.id){ throw new Error('\'replace\' action requires an ID or array of ID\'s to add to the set') }
            if(!Array.isArray(val.id)){ val.id = [val.id] } // make it an array if it's not one already
            params[key] = [[6, 0, val.id]]
            break
        }
      }
    }

    return params
  }

  /*****************************
   * Basic CRUD Methods
   *****************************/

  /**
   * Create a record.
   * @param {string} model - e.g. 'res.partner'
   * @param {object} params - Initial data to include in record eg: { name: 'some name', email: 'email@example.com }
   * @param {string} [externalId] - this is a special parameter. Supplying it will
   * create a linked 'res.model.data' record that is used to store external ID's
   * of other models. See the README for more information.
   * @param {string} [moduleName] - custom module name for external ID (optional).
   * @return {Promise<number>} record ID of the created record
   */
  async create(model: string, params = {}, externalId = '', moduleName = ''){

    params = this.parseManyFields(params)
    const recordId =  await this.execute_kw(model, 'create', [[params]])

    // create external ID if it was supplied
    if(externalId){
      await this.createExternalId(model, recordId, externalId, moduleName || '__api__')
    }

    return recordId
  }

  /**
   * Fetches record data by a list of ID's.
   * @param {string} model - e.g. 'res.partner
   * @param {array|number} recordId - a record ID integer or an array of ID's e.g. `45` or `[45, 15748, 347]`
   * @param {array} [fields] - optional list of fields to return instead of all fields
   * @return {Promise<object>}
   */
  async read(model: string, recordId: number | number[], fields = [] as Array<any>) {

    let params: Array<any>
    Array.isArray(recordId) ? params = [[recordId]] : params = [[[recordId]]]
    if(fields.length){
      params.push({fields: fields})
    }

    return await this.execute_kw(model, 'read', params)

  }

  /**
   * Update record
   * @param {string} model - e.g. 'res.partner'
   * @param {number | array} recordId - e.g. 45 or [45, 271]. If you provide
   * an array, the same value(s) are updated in every record.
   * @param {object} params - Whatever fields you want to update e.g.
   * { name: 'some name', email: 'john@example.com }
   * if updating a many2many or one2many field, use a special object. For more info,
   * view the readme.
   * @return {Promise<boolean>} Returns true if update succeeds
   */
  async update(model:string, recordId: number, params = {}) {

    params = this.parseManyFields(params)
    return await this.execute_kw(model, 'write', [[recordId, params]])

  }

  async delete(model: string, recordId: number){

    await this.execute_kw(model, 'unlink', [[recordId]])
    return true

  }

  /*****************************
   * Other Methods
   *****************************/

  /**
   * Search for matching records and return them with the record data.
   * @param {string} model e.g. 'res.partner'
   * @param {object} [domain] What to match in search e.g. country_id: 'United States'.
   * provide empty object to return all records. Leave out or provide an empty
   * object to return all records.
   * @param {array} [fields] - fields to return in response e.g. ['name', 'state_id']
   * @param {object} [opts] - options e.g. { offset: 100, limit: 5, order: 'category, birthday desc' }
   * @return {Promise<Array>}
   */
  async searchRead(model: string, domain: object, fields = [] as string[], opts = { offset: 0, limit: 0, order: '', context: {}}) {

    let domainArray = []
    if(domain){
      // check to see if this is already a domain filter array
      // if it's not, make an array
      if(Array.isArray(domain)
        && (typeof domain[0] === 'string'
          && !['&','|','!'].includes(domain[0]))){

        domainArray = [domain]

        // or if it's already an array, don't make it one
      }else if(Array.isArray(domain)
        && (Array.isArray(domain[0])
          || ['&','|','!'].includes(domain[0]))){

        domainArray = domain

      }else{ // or if it's an object, make it into an array
        for (let [key, value] of Object.entries(domain)) {
          domainArray.push([key, '=', value])
        }
      }
    }

    let params = []
    params.push([domainArray])
    params.push({fields: fields, offset: opts.offset, limit: opts.limit, order: opts.order, context: opts.context})

    return await this.execute_kw(model, 'search_read', params)

  }

  /**
   * Search for matching records and return ID's in an array.
   * @param {string} model - e.g. 'res.partner'
   * @param {object|array} [domain] - What to match / filter in search e.g.
   * {country_id: 'United States'}.
   * Or you can use an array like: ['country_id', 'in', ['United States', 'Canada']].
   * Or an array of arrays like: [['country_id', '=', 'Canada'],['email','=','lostinspace@example.com']]
   * Lots of filters you can use: https://www.odoo.com/documentation/14.0/reference/orm.html#reference-orm-domains
   * Leave out or provide empty object ro return all records.
   * @return {Promise<Array>}
   */
  async search(model: string, domain: object) {

    let domainArray = []

    if(domain){
      // check to see if this is already a domain filter array
      // if it's not, make an array
      if(Array.isArray(domain)
        && (typeof domain[0] === 'string'
          && !['&','|','!'].includes(domain[0]))){

        domainArray = [domain]

        // or if it's already an array, don't make it one
      }else if(Array.isArray(domain)
        && (Array.isArray(domain[0])
          || ['&','|','!'].includes(domain[0]))){

        domainArray = domain

      }else{
        // or if it's an object, make it into an array
        for(const [key, value] of Object.entries(domain)) {
          domainArray.push([key, '=', value])
        }
      }
    }

    let params = []
    params.push([domainArray])

    return await this.execute_kw(model, 'search', params)

  }

  async getFields(model: string, attributes = [] as any[]){
    return await this.execute_kw( model, 'fields_get', [[],{'attributes': attributes}], )
  }

  /**
   * Execute a server action on a record or set of records. 
   * Oddly, the Odoo API returns **false** if it was successful, or an error if it wasn't.
   * 
   * @param {string} model - name of model, example: `sale.order`
   * @param {string} action - name of action example: `action_confirm`
   * @param {number | number[]} recordId - record ID or array of record IDs to execute the action on.
   * @returns {Promise<boolean>} - oddly, this returns **false** if it was successful, or an error if it wasn't.
   */
  async action(model: string, action: string, recordId: number | number[]){
    return await this.execute_kw(model, action, [[recordId]])
  }

  /*****************************
   *  Working with external identifiers
   *
   *  External ID's are created automatically when exporting or importing data using the Odoo
   *  user interface, but when working with the API this must be done intentionally.
   *
   *  External IDs are managed separately in the 'ir.model.data' model.
   *
   *  The below methods make working with external ID's easy through the API.
   *
   ****************************/

  async createExternalId(model: string, recordId: number, externalId: string, moduleName: string){
    // return record ID
    return await this.execute_kw('ir.model.data', 'create', [[
      {
        model: model,
        name: `${externalId}`,
        res_id: recordId,
        module: moduleName || '__api__'
      }
      ]])
  }

  async searchByExternalId(externalId: string){
    const irModelData = await this.searchRead('ir.model.data', { name: externalId }, ['res_id'])
    if(!irModelData.length){
      throw new Error(`No matching record found for external identifier ${externalId}`)
    }
    return irModelData[0]['res_id']
  }

  async readByExternalId(externalId: string, fields = []){
    const irModelData = await this.searchRead('ir.model.data', { name: externalId }, ['res_id', 'model'])
    if(!irModelData.length){
      throw new Error(`No matching record found for external identifier ${externalId}`)
    }
    return (await this.read(irModelData[0].model, [irModelData[0].res_id], fields ))[0]
  }

  async updateByExternalId(externalId: string, params = {}){
    const irModelData = await this.searchRead('ir.model.data', { name: externalId }, ['res_id', 'model'])
    if(!irModelData.length){
      throw new Error(`No matching record found for external identifier ${externalId}`)
    }
    return await this.update(irModelData[0].model, irModelData[0].res_id, params)
  }

  async deleteByExternalId(externalId: string){
    const irModelData = await this.searchRead('ir.model.data', { name: externalId }, ['res_id', 'model'])
    if(!irModelData.length){
      throw new Error(`No matching record found for external ID ${externalId}`)
    }
    return await this.delete(irModelData[0].model, irModelData[0].res_id)
  }

}