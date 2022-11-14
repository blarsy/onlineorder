import { docs_v1 } from "googleapis"
import { getDocs } from "./google"
import config from '../serverConfig'
import { NonLocalProductData, ProductData } from "../common"

export const createProductTables = async (products: ProductData[], nonLocalProducts: NonLocalProductData[] ): Promise<void> => {
    const docs = getDocs()
    const theDoc = await docs.documents.get({ documentId: config.googleDocIdOffer })
    const index = findTextRunStartIndex(theDoc.data.body!.content!, '<offer>')

    const requests = [] as docs_v1.Schema$Request[]

    const subtitles = {
        'Légume': 'Première gamme, certifiée bio ou en conversion',
        'Aromatique' : 'Plein de goûts en frais, ou en séché',
        'Fruit': 'Nos fruits locaux et bios ou en conversion'
    } as {[cat: string]: string}

    const nonLocalCells = [] as StyledText[]
    nonLocalProducts.forEach(product => {
        nonLocalCells.push({ text: product.name})
        nonLocalCells.push({ text: product.unit})
        nonLocalCells.push({ text: product.price.toLocaleString('fr-BE', {style:'currency', currency:'EUR'})})
        nonLocalCells.push({ text: product.packaging.toLocaleString('fr-BE')})
    })
    requests.push(...nonLocalPriceTable(index, nonLocalCells, 'Hors coopérative', 'Certifié Bio, fournisseur non local'))

    const productsByCategory = {} as {[category: string]: ProductData[]}
    products.forEach(product => {
        if(productsByCategory[product.category]) {
            productsByCategory[product.category].push(product)
        } else {
            productsByCategory[product.category] = [product]
        }
    })
    Object.keys(productsByCategory).reverse().forEach(cat => {
        const cells = [] as StyledText[]
        productsByCategory[cat].forEach(product => {
            cells.push({ text: product.name })
            cells.push({ text: product.unit })
            cells.push({ text: product.quantity.toLocaleString('fr-BE') })
            cells.push({ text: product.price.toLocaleString('fr-BE', {style:'currency', currency:'EUR'}) })
        })
        requests.push(...priceTable(index, cells, cat, subtitles[cat] ))
    })

    await docs.documents.batchUpdate({
        documentId: config.googleDocIdOffer,
        requestBody: {
            requests 
        }
    })
}

const productTableTitles = (index: number, title: string, subtitle: string): docs_v1.Schema$Request[] => {
    return [
        { updateParagraphStyle: {
            paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
                alignment: "CENTER",
            },
            fields: 'namedStyleType, alignment',
            range: {
                startIndex: index,
                endIndex: index + 1
            }
        }},
        ...write(index, { text: '\n' + subtitle, style: { textStyle: {
            bold: true,
            fontSize: {
                magnitude: 12,
                unit: "PT"
            },
            weightedFontFamily: {
                fontFamily: "Avenir",
                weight: 400
            }
        }, range: { startIndex: index, endIndex: index + 1 } } }),
        { updateParagraphStyle: {
            paragraphStyle: {
                namedStyleType: "HEADING_1",
                alignment: "CENTER",
                lineSpacing: 100,
                spacingMode: "NEVER_COLLAPSE",
                spaceAbove: {
                  magnitude: 30,
                  unit: "PT"
                },
                spaceBelow: {
                  magnitude: 10,
                  unit: "PT"
                },
                indentFirstLine: {
                  magnitude: 18,
                  unit: "PT"
                },
                indentStart: {
                  magnitude: 18,
                  unit: "PT"
                }
            },
            fields: 'namedStyleType, alignment, lineSpacing, spacingMode, spaceAbove(magnitude, unit), spaceBelow(magnitude, unit), indentFirstLine(magnitude, unit), indentStart(magnitude, unit)',
            range: {
                startIndex: index,
                endIndex: index + 1
            }
        }},
        ...write(index, { text: title, style: { textStyle: { 
            bold: true,
            fontSize: {
                magnitude: 24,
                unit: 'PT'
            },
            weightedFontFamily: {
                fontFamily: 'Avenir',
                weight: 400
            }
        }, range: { startIndex: index, endIndex: index + 1 }, 
        fields: 'bold, fontSize(magnitude, unit), weightedFontFamily(fontFamily, weight)' } }),
    ]
}

interface StyledText {
    text: string, 
    style?: docs_v1.Schema$UpdateTextStyleRequest
}

interface CellInfo {
    index: number, 
    style?: docs_v1.Schema$UpdateParagraphStyleRequest,
    textStyle?: docs_v1.Schema$UpdateTextStyleRequest
}

const nonLocalPriceTable = (index: number, content: StyledText[], title: string, subTitle: string): docs_v1.Schema$Request[] => {
    const rows = Math.ceil(content.length / 4) + 1
    const stylingReqs = [{
        updateTableCellStyle: {
            tableRange: {
                columnSpan: 1,
                rowSpan: rows,
                tableCellLocation: {
                    tableStartLocation: { index: index + 1 },
                    columnIndex: 3,
                }
            },
            tableCellStyle: {
                backgroundColor: { color: { rgbColor: { red: 1, green: 0.8509804, blue: 0.4}}}
            },
            fields: 'backgroundColor.color.rgbColor'
        }
    },{
        updateTableCellStyle: {
            tableRange: {
                columnSpan: 4,
                rowSpan: 1,
                tableCellLocation: {
                    tableStartLocation: { index: index + 1 },
                    rowIndex: 0
                }
            },
            tableCellStyle: {
                backgroundColor: { color: { rgbColor: { red: 0.7176471, green: 0.7176471, blue: 0.7176471 }}}
            },
            fields: 'backgroundColor.color.rgbColor'
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [0],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 240,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [1],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 72.75,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [2],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 52.5,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [3],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 113.25,
                    unit: "PT"
                }
            }
        }
    }] as docs_v1.Schema$Request[]
    const headerTextStyle = {
        textStyle: {
            fontSize: {
                magnitude: 13,
                unit: 'PT'
            },
            weightedFontFamily: {
                fontFamily: 'Avenir',
                weight: 400
            }
        },
        fields: 'fontSize(magnitude, unit), weightedFontFamily(fontFamily, weight)'
    }

    const emptyNormalParagraphReqs = [
        ...write(index, { text: '\n' } ),
        { updateParagraphStyle: {
            fields: 'namedStyleType',
            range: { startIndex: index, endIndex: index + 1 },
            paragraphStyle: { namedStyleType: 'NORMAL_TEXT' }
        }}
    ] as docs_v1.Schema$Request[]

    return table(index, [undefined, undefined, undefined,{ paragraphStyle: {
            alignment: 'END'
        },
        fields: 'alignment'
    }], [{ text: 'Nom', style: headerTextStyle }, { text: 'Unité', style: headerTextStyle }, { text: 'Prix HTVA/unité', style: headerTextStyle }, { text: 'Conditionnement', style: headerTextStyle },...content],
    [ ...stylingReqs, ...productTableTitles(index, title, subTitle), ...emptyNormalParagraphReqs])
}


const priceTable = (index: number, content: StyledText[], title: string, subTitle: string): docs_v1.Schema$Request[] => {
    const rows = Math.ceil(content.length / 4) + 1
    const stylingReqs = [{
        updateTableCellStyle: {
            tableRange: {
                columnSpan: 1,
                rowSpan: rows,
                tableCellLocation: {
                    tableStartLocation: { index: index + 1 },
                    columnIndex: 3,
                }
            },
            tableCellStyle: {
                backgroundColor: { color: { rgbColor: { red: 0.5764706, green: 0.76862746, blue: 0.49019608}}}
            },
            fields: 'backgroundColor.color.rgbColor'
        }
    },{
        updateTableCellStyle: {
            tableRange: {
                columnSpan: 4,
                rowSpan: 1,
                tableCellLocation: {
                    tableStartLocation: { index: index + 1 },
                    rowIndex: 0
                }
            },
            tableCellStyle: {
                backgroundColor: { color: { rgbColor: { red: 0.7176471, green: 0.7176471, blue: 0.7176471 }}}
            },
            fields: 'backgroundColor.color.rgbColor'
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [0],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 240,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [1],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 72.75,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [2],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 52.5,
                    unit: "PT"
                }
            }
        }
    }, {
        updateTableColumnProperties: {
            columnIndices: [3],
            fields: 'widthType, width(magnitude, unit)',
            tableStartLocation: { index: index + 1 },
            tableColumnProperties: {
                widthType: 'FIXED_WIDTH',
                width: {
                    magnitude: 113.25,
                    unit: "PT"
                }
            }
        }
    }] as docs_v1.Schema$Request[]

    const headerTextStyle = {
        textStyle: {
            fontSize: {
                magnitude: 13,
                unit: 'PT'
            },
            weightedFontFamily: {
                fontFamily: 'Avenir',
                weight: 400
            }
        },
        fields: 'fontSize(magnitude, unit), weightedFontFamily(fontFamily, weight)'
    }

    const emptyNormalParagraphReqs = [
        ...write(index, { text: '\n' } ),
        { updateParagraphStyle: {
            fields: 'namedStyleType',
            range: { startIndex: index, endIndex: index + 1 },
            paragraphStyle: { namedStyleType: 'NORMAL_TEXT' }
        }}
    ] as docs_v1.Schema$Request[]

    return table(index, [undefined, undefined, { paragraphStyle: {
            alignment: 'END'
        },
        fields: 'alignment'
    },{ paragraphStyle: {
            alignment: 'END'
        },
        fields: 'alignment'
    }], [{ text: 'Nom', style: headerTextStyle }, { text: 'Unité', style: headerTextStyle }, { text: 'Dispo', style: headerTextStyle }, { text: 'Prix HTVA/unité', style: headerTextStyle },...content],
    [ ...stylingReqs, ...productTableTitles(index, title, subTitle), ...emptyNormalParagraphReqs])
}

const table = (index: number, 
    columns: ( docs_v1.Schema$UpdateParagraphStyleRequest| undefined)[], 
    content: StyledText[], 
    stylingRequest = [] as docs_v1.Schema$Request[]): docs_v1.Schema$Request[] => {
    const rows = Math.ceil(content.length / columns.length)
    const insertTable = [
    { insertPageBreak: {
        location: { index }
    }},
    { insertTable : {
        columns: columns.length,
        rows,
        location: { index }
    }}] as docs_v1.Schema$Request[]

    let currentIdx = index + 4
    const cellsInfo = [] as CellInfo[]
    for (let i = 0; i < columns.length * rows; i ++) {
        const colNum = i % columns.length

        cellsInfo.push({index: currentIdx, style: columns[colNum], textStyle: content[i] && content[i].style})
        colNum == columns.length - 1 ? currentIdx += 3 : currentIdx += 2
    }

    const contentReqs = [] as docs_v1.Schema$Request[]
    cellsInfo.forEach((cellInfo, idx)  => {
        if(content[idx]) {
            if(cellInfo.style) {
                contentReqs.push({ updateParagraphStyle: {...cellInfo.style, ...{ range: { 
                    startIndex: cellInfo.index, endIndex: cellInfo.index + 1
                }}}})
            }
            contentReqs.push(...write(cellInfo.index, content[idx]))
        }
    })

    return [...insertTable, ...contentReqs.reverse(), ...stylingRequest]
}

const write = (index: number, cell: StyledText): docs_v1.Schema$Request[] => {
    const reqs = [] as docs_v1.Schema$Request[]
    if(cell.style) {
        reqs.push({ updateTextStyle: { 
            ...cell.style, 
            range: {
                startIndex: index,
                endIndex: index + 1
            }, fields: '*'
        }})
    }
    reqs.push({ insertText: {
        location: { index },
        text: cell.text
        } 
    })

    return reqs
}

const findTextRunStartIndex = (contentToSearch: docs_v1.Schema$StructuralElement[], textToSearchFor: string): number => {
    let result = null
    contentToSearch.forEach(element => {
        const paragraph = element.paragraph
        if(paragraph) {
            if(paragraph.elements) {
                const marker = paragraph.elements.find(element => element.textRun && element.textRun.content && element.textRun.content.includes(textToSearchFor))
                if(marker) {
                    result = marker.startIndex!
                }
            }
        }
    })
    if(!result) {
        throw new Error('text not found')
    } else {
        return result
    }
}