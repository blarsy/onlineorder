import { getWeek } from './dateWeek'
import { getSheets } from './google'
import { getProducers, getLocalProductsByCategories, OdooProducer, OdooProductsByCategory } from './odoo'
import config from './serverConfig'

interface ProductQuantities {
    [productId: number]:{
        producerQuantities: {
            [producerId: number]: number | string
        }
    }
}

interface AvailableProductsSnapshot {
    delivery: Date,
    productQuantities: ProductQuantities,
    productQuantitiesPlannedCrops: ProductQuantities
}

interface ProductSheetInput {
    firstDataRow: number,
    productColHeaders: string[],
    producers: OdooProducer[],
    producersWithPlannedCrops: OdooProducer[],
    products: OdooProductsByCategory,
    numberOfProducts: number
}

export const createBlankQuantitiesSheet = async (delivery: Date) => {
    const sheetId = await createNewSheet(
        config.googleSheetIdProducts, 
        'Disponibilités semaine prochaine',
        { gridProperties: { columnCount: 50 } })
    await createProductsSheet(config.googleSheetIdProducts, 
        sheetId, delivery, 
        ['bertrand.larsy@gmail.com', config.googleServiceAccount])
}


export const createNewSheet = async(spreadsheetId: string, sheetTitle: string, additionalSheetProps: object): Promise<number> => {
    const sheets = getSheets()
    let num = 1
    let currentTitle = sheetTitle

    let targetSheet = null
    do {
        targetSheet = (await sheets.spreadsheets.get({ 
            spreadsheetId })).data.sheets?.find(sheet => sheet.properties?.title === currentTitle)
        
        if(targetSheet){
            currentTitle = `${sheetTitle}${num ++}`
        }
    } while(targetSheet)
    const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                addSheet: {
                    properties: {
                        ... additionalSheetProps,
                        title: currentTitle,
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
    return (date.getTime() - refDate) / millisecondsInADay
}
const fromSheetDate = (num : number): Date => {
    const refDate = new Date(1899, 11, 30, 0, 0, 0, 0).getTime()
    const millisecondsInADay = 1000 * 60 * 60 * 24
    return new Date(num * millisecondsInADay + refDate)
}

export const createProductsSheet = async (spreadsheetId: string, sheetId: number, delivery: Date, adminUsers: string[], initialQuantities?: AvailableProductsSnapshot) => {
    const productSheetInput = await getProductSheetInput()
    const products = productSheetInput.products
    const numberOfProducts = productSheetInput.numberOfProducts

    const firstDataRow = productSheetInput.firstDataRow
    const lastProductRow = firstDataRow + numberOfProducts

    const productColHeaders = productSheetInput.productColHeaders
    const colTitles = [...productColHeaders]
    colTitles.push(...productSheetInput.producers.map(producer => producer.name))
    colTitles.push(...productSheetInput.producersWithPlannedCrops.map(producer => producer.name))
    const producersIds = productSheetInput.producers.map(producer => producer.id)
    producersIds.push(...productSheetInput.producersWithPlannedCrops.map(producer => producer.id))
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

    const targetSheet = (await sheets.spreadsheets.get({ 
        spreadsheetId })).data.sheets?.find(sheet => sheet.properties?.sheetId === sheetId)

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                // define a date format for the cell that will receive the delivery date
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0, endRowIndex: 1,
                        startColumnIndex: 3, endColumnIndex: 4
                    },
                    cell: {
                        userEnteredFormat: {
                            numberFormat: {
                                type: 'DATE',
                                pattern: 'dd/MM/yyy hh:mm'
                            }
                        }
                    },
                    fields: 'userEnteredFormat.numberFormat(type, pattern)'
                }
            }]
        }
    })
    
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
                    range: `${targetSheet?.properties?.title}!C1:E1`,
                    values: [[ 'Date de livraison', toSheetDate(delivery), `semaine ${getWeek(delivery)}` ]]
                }
            ]
        }
    })

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
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
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 1,
                            endColumnIndex: 4
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: 'RIGHT',
                                textFormat: {
                                    bold: true,
                                    fontSize: 18
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

export const parseProductSheet = async (spreadsheetId: string, sheetName: string): Promise<AvailableProductsSnapshot> => {
    const sheets = await getSheets()
    const productSheetInput = await getProductSheetInput()
    const spreadSheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = await spreadSheet.data.sheets?.find(sheet => sheet.properties?.title === sheetName)
    const res = await sheets.spreadsheets.getByDataFilter({ 
        spreadsheetId, requestBody: {
            dataFilters: [{
                // raw quantities data
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: productSheetInput.productColHeaders.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            },{
                // raw quantities data for planned crops
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            }, {
                // column containing the product ids
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: 0,
                    endColumnIndex: 1,
                    startRowIndex: productSheetInput.firstDataRow - 1, 
                    endRowIndex: productSheetInput.firstDataRow - 1 + productSheetInput.numberOfProducts
                }
            }, {
                // row containing the producer ids
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: productSheetInput.productColHeaders.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    startRowIndex: productSheetInput.firstDataRow - 3, 
                    endRowIndex: productSheetInput.firstDataRow - 2
                }
            }, {
                // row containing the producer ids (with planned crops)
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length,
                    endColumnIndex: productSheetInput.productColHeaders.length + productSheetInput.producers.length + productSheetInput.producersWithPlannedCrops.length,
                    startRowIndex: productSheetInput.firstDataRow - 3, 
                    endRowIndex: productSheetInput.firstDataRow - 2
                }
            }, {
                // Cell containing delivery date
                gridRange: {
                    sheetId: sheet?.properties?.sheetId, startColumnIndex: 3,
                    endColumnIndex: 4,
                    startRowIndex: 0, 
                    endRowIndex: 1
                }
            }], 
            includeGridData: true,
        }
    })
    const [rawQuantities, rawQuantitiesPlannedCrops, productIds, producerIds, producersWithPlannedCropsIds, deliveryDate] = res.data.sheets![0].data!
    const productQuantities = {} as ProductQuantities

    rawQuantities.rowData?.forEach((row, idx) => {
        const productId = productIds.rowData![idx].values![0].userEnteredValue!.numberValue!
        row.values!.forEach((quantityCell, qtyIdx) => {
            const producerId = producerIds.rowData![0].values![qtyIdx].userEnteredValue!.numberValue!

            if(quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) {
                if(!productQuantities[productId]){
                    productQuantities[productId] = { producerQuantities: {} as {[producerId: number]: number} }
                }
                productQuantities[productId].producerQuantities[producerId] = (quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) as number | string
            }
        })
    })

    const productQuantitiesPlannedCrops = {} as ProductQuantities

    rawQuantitiesPlannedCrops.rowData?.forEach((row, idx) => {
        const productId = productIds.rowData![idx].values![0].userEnteredValue!.numberValue!
        row.values!.forEach((quantityCell, qtyIdx) => {
            const producerId = producersWithPlannedCropsIds.rowData![0].values![qtyIdx].userEnteredValue!.numberValue!

            if(quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) {
                if(!productQuantitiesPlannedCrops[productId]){
                    productQuantitiesPlannedCrops[productId] = { producerQuantities: {} as {[producerId: number]: number} }
                }
                productQuantitiesPlannedCrops[productId].producerQuantities[producerId] = (quantityCell.userEnteredValue?.numberValue || quantityCell.userEnteredValue?.stringValue) as number | string
            }
        })
    })

    const result = { productQuantities, productQuantitiesPlannedCrops,
        delivery: fromSheetDate(deliveryDate.rowData![0].values![0].userEnteredValue!.numberValue!)}
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

const makeProductQuantitiesLine = (initialProductQuantities: (number | string | null)[], initialQuantities: AvailableProductsSnapshot, productId: number, producers: OdooProducer[], producersWithPlannedCrops: OdooProducer[]) => {
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
    }   
}
