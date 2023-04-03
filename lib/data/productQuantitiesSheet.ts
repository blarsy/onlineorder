import { DeliveryDate, easyDate } from '../common'
import { getSheets } from './google'
import { getProducers, getLocalProductsByCategories, OdooProducer, OdooProductsByCategory } from './odoo'
import config from '../serverConfig'
import { sheets_v4 } from 'googleapis'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

interface ProductQuantities {
    [productId: number]:{
        producerQuantities: {
            [producerId: number]: number | string
        }
    }
}

interface AvailableProductsSnapshot {
    deliveryDates: DeliveryDate[],
    deadline: Date,
    productQuantities: ProductQuantities,
    productQuantitiesPlannedCrops: ProductQuantities,
    productQuantitiesInStock: {[productId: number]:number | string}
}

interface ProductSheetInput {
    firstDataRow: number,
    productColHeaders: string[],
    producers: OdooProducer[],
    producersWithPlannedCrops: OdooProducer[],
    products: OdooProductsByCategory,
    numberOfProducts: number
}

const toSheet = (deliveryDates: DeliveryDate[]): string => {
    const lines = deliveryDates.map(deliveryDate => `${deliveryDate.productCategories.join(', ')}: ${dayjs(deliveryDate.date).format('DD/MM/YYYY HH:mm')}`)
    return lines.join('\n')
}

export const fromSheetDeliveryDates = (sheetData: string): DeliveryDate[] => {
    //Ignore cells that have no string content until next version of the software, otherwise
    //the first creations of sheet after the deployment of the new version will fail
    if(!sheetData) return []

    const lines = sheetData.split('\n')
    return lines.map(line => {
        const reRes = /^(.*): (.*)/.exec(line)
        if(!reRes || reRes.length < 3) throw new Error(`Could not parse delivery dates ${sheetData}`)
        const categories = reRes![1]
        const sheetDate = reRes![2]
        return <DeliveryDate>{
            date: dayjs(sheetDate, 'DD/MM/YYYY HH:mm').toDate(),
            productCategories: categories.split(', ')
        }
    })
}

export const getAllSheetsOfSpreadsheet = async (spreadsheetId: string): Promise<sheets_v4.Schema$Sheet[]> => {
    const sheets = getSheets()
    return (await sheets.spreadsheets.get({ spreadsheetId })).data.sheets!
}

export const createBlankQuantitiesSheet = async (deliveryDates: DeliveryDate[], deadline: Date, sourceSheetId?: number, copyPlannedCropsOnly = true) => {
    let initialData = undefined as AvailableProductsSnapshot | undefined
    let initialDataPromise = undefined

    if(sourceSheetId) {
        initialDataPromise = parseProductSheet(config.googleSheetIdProducts, sourceSheetId, copyPlannedCropsOnly)
    }
    const spreadSheetsheets = await getAllSheetsOfSpreadsheet(config.googleSheetIdProducts)

    const newSheetId = await createNewSheet(
        config.googleSheetIdProducts,
        spreadSheetsheets,
        `Disponibilités, clôture le ${easyDate(deadline)}`,
        { gridProperties: { columnCount: 50 } })
    
    if(initialDataPromise) {
        initialData = await initialDataPromise
    }

    await createProductsSheet(config.googleSheetIdProducts, 
        newSheetId, deliveryDates, deadline,
        ['bertrand.larsy@gmail.com', config.googleServiceAccount], initialData)
}

export const updateQuantitiesSheet = async(sourceSheetId: number): Promise<void> => {
    const currentDataPromise = parseProductSheet(config.googleSheetIdProducts, sourceSheetId, false)
    
    const sheets = getSheets()
    const spreadSheetsheets = await getAllSheetsOfSpreadsheet(config.googleSheetIdProducts)
    const sourceSheetName = spreadSheetsheets.find(sheet => sheet.properties!.sheetId! == sourceSheetId)!.properties!.title!
    const newSheetId = await createNewSheet(config.googleSheetIdProducts, spreadSheetsheets, 'Feuille mise à jour', { gridProperties: { columnCount: 50 } })

    const currentData = await currentDataPromise

    await createProductsSheet(config.googleSheetIdProducts, newSheetId, currentData.deliveryDates, currentData.deadline,
        ['bertrand.larsy@gmail.com', config.googleServiceAccount], currentData)

    return sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.googleSheetIdProducts,
        requestBody: {
            requests: [{
                deleteSheet: {
                    sheetId: sourceSheetId,
                }
            },{ 
                updateSheetProperties: {
                    fields: 'title',
                    properties: {
                        sheetId: newSheetId,
                        title: sourceSheetName
                    }
                }
            }]
        }
    }).then(() => {})

}

const getValidName = (title: string, spreadSheetsheets: sheets_v4.Schema$Sheet[]): string => {
    let targetSheet = null
    let currentTitle = title
    let num = 1

    do {
        targetSheet = spreadSheetsheets.find(sheet => sheet.properties?.title === currentTitle)
        
        if(targetSheet){
            currentTitle = `${title}(${num ++})`
        }
    } while(targetSheet)

    return currentTitle
}

export const createNewSheet = async(spreadsheetId: string, spreadSheetsheets: sheets_v4.Schema$Sheet[], sheetTitle: string, additionalSheetProps: object): Promise<number> => {
    const sheets = getSheets()
    const newSheetTitle = getValidName(sheetTitle, spreadSheetsheets)

    const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                addSheet: {
                    properties: {
                        ... additionalSheetProps,
                        title: newSheetTitle,
                    }
                }
            }]
        }
    })
    return res.data.replies![0].addSheet!.properties!.sheetId!
}

const getProductSheetInput =  async (): Promise<ProductSheetInput> => {
    const producersByCategory = await getProducers()
    const products = await getLocalProductsByCategories()
    const numberOfProducts = Object.keys(products).reduce((acc, cat) => acc += products[cat].length, 0) - 1
    return {
        firstDataRow: 4,
        productColHeaders: ['Id', 'Catégorie', 'Nom', 'Unité', 'Marge Coop', 'Prix producteur'],
        producers: producersByCategory['Producteur'],
        producersWithPlannedCrops: producersByCategory['Cultures planifiées'],
        products, numberOfProducts
    }
}

const toSheetDate = (date : Date): number => {
    const refDate = new Date(1899, 11, 30, 0, 0, 0, 0).getTime()
    const millisecondsInADay = 1000 * 60 * 60 * 24
    // Cheap trick: Google sheet does not handle time zones for date
    // Convert to belgian timezone, parse it again to an UTC that includes the timezone offset
    const local = date.toLocaleDateString('fr-BE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h24', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Brussels' })
    const [, day, month, year, hour, minute, second] = /(\d{2})\/(\d{2})\/(\d{4}),? (\d{2}):(\d{2}):(\d{2})/.exec(local)!
    const fakedUtcDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`)
    return (fakedUtcDate.getTime() - refDate) / millisecondsInADay
}
const fromSheetDate = (num : number): Date => {
    const refDate = new Date(1899, 11, 30, 0, 0, 0, 0).getTime()
    const millisecondsInADay = 1000 * 60 * 60 * 24
    const dateInSheet = new Date(num * millisecondsInADay + refDate)
    const regexResults = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(dateInSheet.toISOString())
    if(regexResults) {
        const [, year, month, day, hour, minute, second] = regexResults
        return dayjs(`${day}/${month}/${year} ${hour}:${minute}:${second}`, 'DD/MM/YYYY HH:mm:ss', 'fr-BE').toDate()
    }
    throw new Error (`could not parse date ${dateInSheet.toISOString()}`)
}

export const createProductsSheet = async (spreadsheetId: string, sheetId: number, deliveryDates: DeliveryDate[], deadline: Date, adminUsers: string[], initialQuantities?: AvailableProductsSnapshot) => {
    const productSheetsPromise = getAllSheetsOfSpreadsheet(spreadsheetId)
    const productSheetInput = await getProductSheetInput()
    const products = productSheetInput.products
    const numberOfProducts = productSheetInput.numberOfProducts

    const firstDataRow = productSheetInput.firstDataRow
    const lastProductRow = firstDataRow + numberOfProducts

    const productColHeaders = productSheetInput.productColHeaders
    const colTitles = [...productColHeaders]
    colTitles.push(...productSheetInput.producers.map(producer => producer.name))
    colTitles.push(...productSheetInput.producersWithPlannedCrops.map(producer => producer.name))
    colTitles.push('Stock frigo')
    const producersIds = productSheetInput.producers.map(producer => producer.id)
    producersIds.push(...productSheetInput.producersWithPlannedCrops.map(producer => producer.id))
    producersIds.push(0) // special 'producer' for the storage room
    const lastHeaderCol = colTitles.length

    const productsGridValues = [] as Array<Array<any>>
    Object.keys(products).forEach(cat => {
        productsGridValues.push(...products[cat]
            .map(product => {
                const initialProductQuantities = [] as (number | null)[]
                if(initialQuantities){
                    makeProductQuantitiesLine(initialProductQuantities, initialQuantities, 
                        product.id, productSheetInput.producers, 
                        productSheetInput.producersWithPlannedCrops)
                }
                const margin = (product.sellPrice - product.price) / product.price
                return [product.id, cat, product.name, product.unit,  margin, product.price, ...initialProductQuantities]
            }))
    })
 
    const sheets = getSheets()
    const productSheets = await productSheetsPromise

   const targetSheet = productSheets.find(sheet => sheet.properties?.sheetId == sheetId)
    
    await sheets.spreadsheets.values.batchUpdate({ 
        spreadsheetId, 
        requestBody: {
            valueInputOption: 'RAW',
            data: [{
                    range:`${targetSheet?.properties?.title}!A${firstDataRow}:${getA1Notation(lastProductRow, colTitles.length)}`,
                    values: productsGridValues
                },{
                    range:`${targetSheet?.properties?.title}!${getA1Notation(firstDataRow - 2, productColHeaders.length)}:${getA1Notation(1, lastHeaderCol)}`,
                    values: [producersIds]
                },{
                    range: `${targetSheet?.properties?.title}!A${firstDataRow - 1}:${getA1Notation(firstDataRow - 1, lastHeaderCol)}`,
                    values: [colTitles]
                }, {
                    range: `${targetSheet?.properties?.title}!B1:F1`,
                    values: [[ 'Date de livraison', toSheet(deliveryDates), '', 'Clôture:', toSheetDate(deadline) ]]
                }
            ]
        }
    })

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                // define a date format for the cell that will receive the delivery date
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0, endRowIndex: 1,
                        startColumnIndex: 2, endColumnIndex: 3
                    },
                    cell: {
                        userEnteredFormat: {
                            numberFormat: {
                                type: 'DATE',
                                pattern: 'ddd dd/MM/yyy hh:mm'
                            }
                        }
                    },
                    fields: 'userEnteredFormat.numberFormat(type, pattern)'
                }
            },{
                // define a date format for the cell that will receive the deadline
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0, endRowIndex: 1,
                        startColumnIndex: 5, endColumnIndex: 6
                    },
                    cell: {
                        userEnteredFormat: {
                            numberFormat: {
                                type: 'DATE',
                                pattern: 'ddd dd/MM/yyy hh:mm'
                            },
                            wrapStrategy: 'WRAP'
                        }
                        
                    },
                    fields: 'userEnteredFormat.(numberFormat(type, pattern), wrapStrategy)'
                }
            },{
                addBanding: {
                    bandedRange: {
                        range: {
                            sheetId,
                            startRowIndex: firstDataRow - 2, startColumnIndex: 0,
                            endRowIndex: lastProductRow, endColumnIndex: lastHeaderCol
                        },
                        rowProperties: {
                            headerColor: {
                                blue: 0.7, green: 0.7, red: 0.7
                            },
                            firstBandColor: {
                                blue: 1, green: 1, red: 1
                            },
                            secondBandColor: {
                                blue: 0.85, green: 0.85, red: 0.85
                            }
                        }
                    }
                }},
                {
                    updateSheetProperties: {
                        fields: 'gridProperties.frozenColumnCount,gridProperties.frozenRowCount,',
                        properties: {
                            sheetId,
                            gridProperties: {
                                frozenColumnCount: productColHeaders.length,
                                frozenRowCount: firstDataRow - 1
                            }
                        }
                    }
                },
                {
                    // Make the delivery date appear big enough
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 2,
                            endColumnIndex: 3
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: 'RIGHT',
                                textFormat: {
                                    bold: true,
                                    fontSize: 12
                                }
                            }
                        },
                        fields: 'userEnteredFormat(horizontalAlignment, textFormat(bold, fontSize))'
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: productColHeaders.length,
                            endColumnIndex: productColHeaders.length + 1
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: 'CENTER',
                                textFormat: {
                                    bold: true,
                                    fontSize: 14
                                }
                            },
                            userEnteredValue: {
                                stringValue: 'Invendus \/ Excédents '
                            }
                        },
                        fields: 'userEnteredValue.stringValue,userEnteredFormat(horizontalAlignment, textFormat(bold, fontSize))'
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: productColHeaders.length + productSheetInput.producers.length,
                            endColumnIndex: productColHeaders.length + productSheetInput.producers.length + 1
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: 'CENTER',
                                textFormat: {
                                    bold: true,
                                    fontSize: 14
                                }
                            },
                            userEnteredValue: {
                                stringValue: 'Cultures planifiées'
                            }
                        },
                        fields: 'userEnteredValue.stringValue,userEnteredFormat(horizontalAlignment, textFormat(bold, fontSize))'
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: firstDataRow - 2,
                            endRowIndex: firstDataRow - 1,
                            startColumnIndex: productColHeaders.length + 1,
                            endColumnIndex: productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length
                        },
                        cell: {
                            userEnteredFormat: {
                                wrapStrategy: 'WRAP'
                            }
                        },
                        fields: 'userEnteredFormat.wrapStrategy'
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 3,
                            endColumnIndex: 6
                        },
                        cell: {
                            userEnteredFormat: {
                                wrapStrategy: 'WRAP'
                            }
                        },
                        fields: 'userEnteredFormat.wrapStrategy'
                    },
                },
                {
                    // left border of the column separating producers from producers with planned crops
                    repeatCell: {
                        range: {
                            sheetId,
                            startColumnIndex: productColHeaders.length + productSheetInput.producers.length,
                            endColumnIndex: productColHeaders.length + productSheetInput.producers.length + 1,
                            startRowIndex: 0, endRowIndex: lastProductRow
                        },
                        cell: {
                            userEnteredFormat: {
                                borders: {
                                    left: {
                                        style: 'SOLID'
                                    }
                                }
                            }
                        },
                        fields: 'userEnteredFormat.borders.left'
                    },
                },
                {
                    // Format margin column as percentages
                    repeatCell: {
                        range: {
                            sheetId,
                            startColumnIndex: 4,
                            endColumnIndex: 5
                        },
                        cell: {
                            userEnteredFormat: {
                                numberFormat: {
                                    type: 'PERCENT',
                                    pattern: '0%'
                                }
                            }
                        },
                        fields: 'userEnteredFormat.numberFormat(type, pattern)'
                    },
                },
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [{
                                sheetId,
                                startColumnIndex: productColHeaders.length,
                                endColumnIndex: productColHeaders.length + productSheetInput.producers.length,
                                startRowIndex: firstDataRow - 1,
                                endRowIndex: productsGridValues.length + firstDataRow - 1
                            }],
                            booleanRule: {
                                condition: {
                                    type: 'CUSTOM_FORMULA',
                                    values: [{
                                        userEnteredValue: `=OR(SUM($${getA1Notation(firstDataRow - 1, productColHeaders.length +productSheetInput. producers.length)}:$${getA1Notation(firstDataRow - 1, productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length)}) > 0; AND(ISBLANK(${getA1Notation(firstDataRow - 1, productColHeaders.length)}) = FALSE(); ISNUMBER(${getA1Notation(firstDataRow - 1, productColHeaders.length)}) = FALSE()))`
                                    }]
                                },
                                format: {
                                    backgroundColor: {
                                        red: 0.8784314, green: 0.4, blue: 0.4
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [{
                                sheetId,
                                startColumnIndex: productColHeaders.length + productSheetInput.producers.length,
                                endColumnIndex: productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length,
                                startRowIndex: firstDataRow - 1,
                                endRowIndex: productsGridValues.length + firstDataRow - 1
                            }],
                            booleanRule: {
                                condition: {
                                    type: 'CUSTOM_FORMULA',
                                    values: [{
                                        userEnteredValue: `=AND(ISBLANK(${getA1Notation(firstDataRow - 1, productColHeaders.length  + productSheetInput.producers.length)}) = FALSE(); ISNUMBER(${getA1Notation(firstDataRow - 1, productColHeaders.length + productSheetInput.producers.length)}) = FALSE())`
                                    }]
                                },
                                format: {
                                    backgroundColor: {
                                        red: 0.8784314, green: 0.4, blue: 0.4
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    // Excess / unsold quantities title
                    mergeCells: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: productColHeaders.length,
                            endColumnIndex: productColHeaders.length + productSheetInput.producers.length
                        },
                        mergeType: "MERGE_ALL"
                    }
                },
                {
                    // Planned crops title
                    mergeCells: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: productColHeaders.length + productSheetInput.producers.length,
                            endColumnIndex: productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length
                        },
                        mergeType: "MERGE_ALL"
                    }
                },
                {
                    autoResizeDimensions: {
                      dimensions: {
                        sheetId,
                        dimension: 'COLUMNS',
                        startIndex: 0,
                        endIndex: productColHeaders.length
                      }
                    }
                },
                {
                    // Don't know why, but autosize does not work correctly for 'category' column (makes it too wide)
                    updateDimensionProperties: {
                        range: {
                            sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 1,
                            endIndex: 2,
                        },
                        properties:{
                            pixelSize: 100
                        },
                        fields: 'pixelSize'
                    }
                },
                {
                    //Force unit, margin and price column to smaller width
                    updateDimensionProperties: {
                        range: {
                            sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 3,
                            endIndex: 6,
                        },
                        properties:{
                            pixelSize: 80
                        },
                        fields: 'pixelSize'
                    }
                },
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId,
                            dimension: 'COLUMNS',
                            startIndex: productColHeaders.length + 1,
                            endIndex: productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length,
                        },
                        properties:{
                            pixelSize: 120
                        },
                        fields: 'pixelSize'
                    }
                },
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: firstDataRow - 3,
                            endIndex: firstDataRow - 2,
                        },
                        properties:{
                            hiddenByUser: true
                        },
                        fields: 'hiddenByUser'
                    }
                },
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 0,
                            endIndex: 1
                        },
                        properties: {
                            hiddenByUser: true
                        },
                        fields: 'hiddenByUser'
                    }
                },
                {
                    addProtectedRange: {
                        protectedRange: {
                            description: 'Entête',
                            editors: {
                                domainUsersCanEdit: false,
                                users: adminUsers
                            },
                            range: {
                                sheetId,
                                startRowIndex: 0,
                                endRowIndex: firstDataRow - 1
                            }
                        }
                    }
                },
                {
                    addProtectedRange: {
                        protectedRange: {
                            description: 'Descriptions produits',
                            editors: {
                                domainUsersCanEdit: false,
                                users: adminUsers
                            },
                            range: {
                                sheetId,
                                startColumnIndex: 0,
                                endColumnIndex: productColHeaders.length
                            }
                        }
                    }
                }
            ]
        }
    })
}

export const calculateQuantity = (quantities: AvailableProductsSnapshot, productId: number): number => {
    const producerQuantities = quantities.productQuantities[productId] ? quantities.productQuantities[productId].producerQuantities : {}
    const plannedCropsQuantities = quantities.productQuantitiesPlannedCrops[productId] ? quantities.productQuantitiesPlannedCrops[productId].producerQuantities : {}
    const inStockQuantity = (typeof quantities.productQuantitiesInStock[productId] === 'number') ? quantities.productQuantitiesInStock[productId] as number : 0

    return Object.keys(producerQuantities).reduce<number>((acc, producerId) => 
        acc + (typeof producerQuantities[Number(producerId)] === 'number' ? producerQuantities[Number(producerId)] as number : 0), 0) +
        Object.keys(plannedCropsQuantities).reduce((acc, producerId) => 
        acc + (typeof plannedCropsQuantities[Number(producerId)] === 'number' ? plannedCropsQuantities[Number(producerId)] as number : 0), 0) +
        inStockQuantity
}

export const getProducersOfWhomToRepeatQuantities = async (spreadsheetId: string, numberOfProducers: number): Promise<{[producerId: number]: boolean}> => {
    const producersSettingsSheetId = (await getAllSheetsOfSpreadsheet(spreadsheetId)).find(sheet => sheet.properties!.title! === 'Paramètres producteurs')!.properties!.sheetId!
    const sheets = getSheets()
    const res = await sheets.spreadsheets.getByDataFilter({
        spreadsheetId, requestBody: {
            dataFilters: [{
                gridRange: {
                    sheetId: producersSettingsSheetId,
                    startColumnIndex: 0, endColumnIndex: 1,
                    startRowIndex: 2, endRowIndex: 2 + numberOfProducers
                }
            }, {
                gridRange: {
                    sheetId: producersSettingsSheetId,
                    startColumnIndex: 2, endColumnIndex: 3,
                    startRowIndex: 2, endRowIndex: 2 + numberOfProducers
                }
            }], 
            includeGridData: true
        }
    })
    const [producersIds, repeatQuantitiesSettings] = res.data.sheets![0].data!
    const result = {} as {[producerId: number]: boolean}
    producersIds.rowData!.forEach((producerRow, idx) => result[producerRow.values![0].userEnteredValue!.numberValue!] = repeatQuantitiesSettings.rowData![idx].values![0].userEnteredValue?.boolValue!)
    return result
}

export const parseProductSheet = async (spreadsheetId: string, sheetId: number, plannedCropsOnly?: boolean): Promise<AvailableProductsSnapshot> => {
    const sheets = getSheets()
    const productSheetInput = await getProductSheetInput()
    const producersOfWhomToRepeatQuantitiesPromise = getProducersOfWhomToRepeatQuantities(spreadsheetId, productSheetInput.producers.length)
    const res = await sheets.spreadsheets.getByDataFilter({ 
        spreadsheetId, requestBody: {
            dataFilters: [{
                // raw quantities data
                gridRange: {
                    sheetId, startColumnIndex: productSheetInput.productColHeaders.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            },{
                // raw quantities data for planned crops
                gridRange: {
                    sheetId: sheetId, startColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    // include one more column for the storage room
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length + 1,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            }, {
                // column containing the product ids
                gridRange: {
                    sheetId, startColumnIndex: 0,
                    endColumnIndex: 1,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            }, {
                // row containing the producer ids
                gridRange: {
                    sheetId, startColumnIndex: productSheetInput.productColHeaders.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    startRowIndex: productSheetInput.firstDataRow - 3, 
                    endRowIndex: productSheetInput.firstDataRow - 2
                }
            }, {
                // row containing the producer ids (with planned crops)
                gridRange: {
                    sheetId, startColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    // Take one more column, which is contains the quantities in storage
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length + 1,
                    startRowIndex: productSheetInput.firstDataRow - 3, 
                    endRowIndex: productSheetInput.firstDataRow - 2
                }
            }, {
                // Cell containing delivery date
                gridRange: {
                    sheetId, startColumnIndex: 2,
                    endColumnIndex: 3,
                    startRowIndex: 0, 
                    endRowIndex: 1
                }
            }, {
                // Cell containing deadline
                gridRange: {
                    sheetId, startColumnIndex: 5,
                    endColumnIndex: 6,
                    startRowIndex: 0, 
                    endRowIndex: 1
                }
            }], 
            includeGridData: true,
        }
    })
    const [rawQuantities, rawQuantitiesPlannedCrops, productIds, producerIds, producersWithPlannedCropsIds, deliveryDate, deadlineDate] = res.data.sheets![0].data!
    const productQuantities = {} as ProductQuantities
    const producersOfWhomToRepeatQuantities = await producersOfWhomToRepeatQuantitiesPromise

    rawQuantities.rowData?.forEach((row, idx) => {
        const productId = productIds.rowData![idx].values![0].userEnteredValue!.numberValue!
        row.values!.forEach((quantityCell, qtyIdx) => {
            const producerId = producerIds.rowData![0].values![qtyIdx].userEnteredValue!.numberValue!

            if(!plannedCropsOnly || producersOfWhomToRepeatQuantities[producerId]) {
                if(quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) {
                    if(!productQuantities[productId]){
                        productQuantities[productId] = { producerQuantities: {} as {[producerId: number]: number} }
                    }
                    productQuantities[productId].producerQuantities[producerId] = (quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) as number | string
                }
            }
        })
    })

    const productQuantitiesPlannedCrops = {} as ProductQuantities
    const productQuantitiesInStock = {} as {[productId: number]:(number | string)}

    rawQuantitiesPlannedCrops.rowData?.forEach((row, idx) => {
        const productId = productIds.rowData![idx].values![0].userEnteredValue!.numberValue!
        row.values!.forEach((quantityCell, qtyIdx) => {
            const producerId = producersWithPlannedCropsIds.rowData![0].values![qtyIdx].userEnteredValue!.numberValue!

            if(producerId === 0) {
                productQuantitiesInStock[productId] = (quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) as number | string
            }else if(quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) {
                if(!productQuantitiesPlannedCrops[productId]){
                    productQuantitiesPlannedCrops[productId] = { producerQuantities: {} as {[producerId: number]: number} }
                }
                productQuantitiesPlannedCrops[productId].producerQuantities[producerId] = (quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) as number | string
            }
        })
    })
    
    const result = { productQuantities, productQuantitiesPlannedCrops, productQuantitiesInStock,
        deliveryDates: fromSheetDeliveryDates(deliveryDate.rowData![0].values![0].userEnteredValue ? deliveryDate.rowData![0].values![0].userEnteredValue!.stringValue! : ''),
        deadline: fromSheetDate(deadlineDate.rowData![0].values![0].userEnteredValue!.numberValue!)}
    return result
}

const getA1Notation = (row: number, column: number):string => {
    const a1Notation = [`${row + 1}`];
    const totalAlphabets = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    let block = column;
    while (block >= 0) {
      a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt(0)));
      block = Math.floor(block / totalAlphabets) - 1;
    }
    return a1Notation.join('');
}

const makeProductQuantitiesLine = (initialProductQuantities: (number | string | null)[], 
    initialQuantities: AvailableProductsSnapshot, productId: number, producers: OdooProducer[], 
    producersWithPlannedCrops: OdooProducer[]) => {
    if(initialQuantities.productQuantities[productId]) {
        const productQuantities = initialQuantities.productQuantities[productId].producerQuantities
        producers.forEach(producer => {
            let value = null as number | string | null
            if(productQuantities[producer.id]) {
                value = productQuantities[producer.id]
            }
            initialProductQuantities.push(value)
        })
    } else {
        producers.forEach(() => {
            initialProductQuantities.push(null)
        })
    }
    if(initialQuantities.productQuantitiesPlannedCrops[productId]) {
        const productQuantitiesPlannedCrops = initialQuantities.productQuantitiesPlannedCrops[productId].producerQuantities
        producersWithPlannedCrops.forEach(producer => {
            let value = null as number | string | null
            if(productQuantitiesPlannedCrops[producer.id]) {
                value = productQuantitiesPlannedCrops[producer.id]
            }
            initialProductQuantities.push(value)
        })
    } else {
        producersWithPlannedCrops.forEach(producer => {
            initialProductQuantities.push(null)
        })
    } 
    let inStock = null
    if(initialQuantities.productQuantitiesInStock[productId]){
        inStock = initialQuantities.productQuantitiesInStock[productId]
    }
    initialProductQuantities.push(inStock)
}

