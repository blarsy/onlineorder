import { createProductsSheet, createNewSheet, parseProductSheet } from "../../lib/productQuantitiesSheet"
import creds from '../../google-creds.json'
import { getLocalProductsByCategories, getProductsForOnlineOrdering } from "../../lib/odoo"
import { createDataFile } from "../../lib/dataFile"
import config, { setConfig } from '../../lib/serverConfig'
jest.setTimeout(20000)

test('Get products from Odoo', async () => {
    // const availableProducts = await parseProductSheet('1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 'Produits5', creds.client_email, creds.private_key)
    // const sheetId = await createNewSheet(
    //     '1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
    //     'Produits',
    //     { gridProperties: { columnCount: 50 } },
    //     creds.client_email, creds.private_key)
    // await createProductsSheet('1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
    //     sheetId, new Date('2022-11-03T10:00-02:00'), 
    //     ['bertrand.larsy@gmail.com', 'ordermodule@coopalimentaire.iam.gserviceaccount.com'],
    //     undefined,
    //     creds.client_email, creds.private_key, { "baseUrl": "https://coopalimentaire.odoo.com", "db": "coopalimentaire", "username": "legumerie@coopalimentaire.be", "password": "Coopalim@" })
    // const res = await getLocalProductsByCategories({ "baseUrl": "https://coopalimentaire.odoo.com", "db": "coopalimentaire", "username": "legumerie@coopalimentaire.be", "password": "Coopalim@" })
    // console.log(res)
    setConfig({ googleServiceAccount: creds.client_email, 
        googlePrivateKey: creds.private_key, 
        connectionInfo: { "baseUrl": "https://coopalimentaire.odoo.com", "db": "coopalimentaire", "username": "legumerie@coopalimentaire.be", "password": "Coopalim@" } ,
        googleSheetIdCustomers: '1GtOR0Hb6lrzUhGguFxEdivKwqm-v3x6LY-tCF0IgblQ',
        workingFileName: 'testdata.json',
        workingFolderName: 'Coop-dev',
        googleSheetIdProducts: '1do3iJhMD_k_zg0UnFCEhAaEEwtVMM8aeFYDX4mRG8S4',
        volumesFileName: 'testvolumes.json'
    })
    const availableProducts = await parseProductSheet('1do3iJhMD_k_zg0UnFCEhAaEEwtVMM8aeFYDX4mRG8S4', 'Disponibilités semaine prochaine')
    const sheetId = await createNewSheet(
        '1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
        'Produits',
        { gridProperties: { columnCount: 50 } })
    await createProductsSheet('1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
        sheetId, new Date('2022-11-10T09:00-02:00'), 
        ['bertrand.larsy@gmail.com', 'ordermodule@coopalimentaire.iam.gserviceaccount.com'],
        availableProducts)
    
    //const res = await getLocalProductsByCategories({ "baseUrl": "https://coopalimentaire.odoo.com", "db": "coopalimentaire", "username": "legumerie@coopalimentaire.be", "password": "Coopalim@" })
    //console.log(res)

    // const result = await parseProductSheet('1do3iJhMD_k_zg0UnFCEhAaEEwtVMM8aeFYDX4mRG8S4', 'Disponibilités semaine prochaine')
    // console.log(result)
    
    //await createDataFile(new Date(2022,10,10,10,0,0), new Date(2022, 10, 8, 9,0,0), 'Disponibilités semaine prochaine')
})