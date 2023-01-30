import creds from '../../google-creds.json'
import config, { setConfig } from '../../lib/serverConfig'
import { fromSheetDeliveryDates, parseProductSheet } from '../../lib/data/productQuantitiesSheet'

jest.setTimeout(20000)

test('Autofill offer doc', async () => {
    setConfig({ googleServiceAccount: creds.client_email, 
        googlePrivateKey: creds.private_key, 
        connectionInfo: { "baseUrl": "https://coopalimentaire.odoo.com", "db": "coopalimentaire", "username": "legumerie@coopalimentaire.be", "password": "Coopalim@" } ,
        googleSheetIdCustomers: '1GtOR0Hb6lrzUhGguFxEdivKwqm-v3x6LY-tCF0IgblQ',
        googleDocIdOffer: '1PskODuvkAhSIUnNTLSmhGf74LMJ2UhhdX-XblAwGYN8',
        workingFileName: 'testdata.json',
        workingFolderName: 'Coop-dev',
        googleSheetIdProducts: '1Ev2npHZcPOJKYg2TKSop3jJNIxudOT-m_yq9fWz5XqE',
        volumesFileName: 'testvolumes.json',
        odooProductTags: ['a','b','c','d','e','f']
    })

    const sheetData = 'a, b, c: 123456\nd, e, f: 654321'
    console.log(fromSheetDeliveryDates(sheetData))


    // const res = await parseProductSheet(config.googleSheetIdProducts, 2066779984)
    // console.log(res)
    //await parseProductSheet(config.googleSheetIdProducts, 2042364649, true)

    //await new OdooXmlRpc(config.connectionInfo).connect()



    

    //console.log(await getProducersOfWhomToRepeatQuantities(config.googleSheetIdProducts, 14))

    // const docs = getDocs()
    // const theDoc = await docs.documents.get({ documentId: config.googleDocIdOffer })
    // console.log(JSON.stringify(theDoc.data.body?.content))
    
    // const pointOfInsertion = findTextRunStartIndex(theDoc.data.body!.content!, '<offer>')

    // const tableTitle = 'Légumes locaux et bios - ou en conversion, catégorie 1'
    // await docs.documents.batchUpdate({ documentId: config.googleDocIdOffer,
    //     requestBody: {
    //         requests: [
    //             { insertTable: {
    //                 columns: 4,
    //                 location:  { index: pointOfInsertion },
    //                 rows: 4,
    //             }},
    //             write(pointOfInsertion, tableTitle),
    //         ]
    //     }
    // })
    // const tableIndex = pointOfInsertion + tableTitle.length
    // await docs.documents.batchUpdate({ documentId: config.googleDocIdOffer,
    //     requestBody: {
    //         requests: [
    //             write(tableIndex + 1, '1'),
    //             write(tableIndex + 2, '2'),
    //             write(tableIndex + 3, '3'),
    //             write(tableIndex + 4, '4'),
    //             write(tableIndex + 5, '5'),
    //             write(tableIndex + 6, '6'),
    //             write(tableIndex + 7, '7'),
    //             write(tableIndex + 8, '8'),
    //             write(tableIndex + 9, '9'),
    //             write(tableIndex + 10, '10'),
    //             write(tableIndex + 11, '11'),
    //             write(tableIndex + 12, '12'),
    //             write(tableIndex + 13, '13'),
    //             write(tableIndex + 14, '14'),
    //             write(tableIndex + 15, '15'),
    //             write(tableIndex + 16, '16'),
    //         ]
    //     }
    // })
    
})
