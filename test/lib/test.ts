import { createProductsSheet, createNewSheet, parseProductSheet } from "../../lib/productQuantitiesSheet"
import creds from '../../google-creds.json'
jest.setTimeout(20000)

test('Get products from Odoo', async () => {
    //await logSheetInfo('1do3iJhMD_k_zg0UnFCEhAaEEwtVMM8aeFYDX4mRG8S4')
    const availableProducts = await parseProductSheet('1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 'Produits5', creds.client_email, creds.private_key)
    const sheetId = await createNewSheet(
        '1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
        'Produits',
        { gridProperties: { columnCount: 50 } },
        creds.client_email, creds.private_key)
    await createProductsSheet('1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE', 
        sheetId, availableProducts.weekNumber + 1, 
        ['bertrand.larsy@gmail.com', 'ordermodule@coopalimentaire.iam.gserviceaccount.com'],
        { weekNumber: availableProducts.weekNumber, productQuantities: {}, productQuantitiesPlannedCrops: availableProducts.productQuantitiesPlannedCrops },
        creds.client_email, creds.private_key)

})