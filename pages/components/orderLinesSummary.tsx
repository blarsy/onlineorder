import { OrderData } from "../../lib/common"
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material"

interface Props {
    order: OrderData
}

const OrderLinesSummary = ({ order }: Props) => {
    const quantitiesPerCategory: {
        [category: string]: {
            productName: string,
            quantity: number,
            unit: string,
            price: number,
        }[]
    } = {}
    order.quantities.forEach(quantity => {
        const dataToAdd = {
            productName: quantity.productName,
            quantity: quantity.quantity,
            unit: quantity.unit,
            price: quantity.price
        }
        if(quantitiesPerCategory[quantity.category]){
            quantitiesPerCategory[quantity.category].push(dataToAdd)
        } else {
            quantitiesPerCategory[quantity.category] = [ dataToAdd ]
        }
    })
    return <TableContainer component={Paper}>
        <Table size="small">
            <TableHead sx={{ backgroundColor: '#CCC'}}>
                <TableCell>Nom</TableCell>
                <TableCell align="right">Quantité</TableCell>
                <TableCell align="right">Unité</TableCell>
                <TableCell align="right">Prix/unité</TableCell>
                <TableCell align="right">Total</TableCell>
            </TableHead>
            <TableBody>
                {Object.keys(quantitiesPerCategory).map(category => {
                    return [<TableRow>
                        <TableCell colSpan={5} align="center"><Typography variant="overline">{category}</Typography></TableCell>
                    </TableRow>,
                    quantitiesPerCategory[category].map(quantity => <TableRow>
                        <TableCell>{quantity.productName}</TableCell>
                        <TableCell align="right">{quantity.quantity}</TableCell>
                        <TableCell align="right">{quantity.unit}</TableCell>
                        <TableCell align="right">{quantity.price.toFixed(2)}€</TableCell>
                        <TableCell align="right">{(quantity.quantity * quantity.price).toFixed(2)}€</TableCell>
                    </TableRow>)]
                })}
            </TableBody>
        </Table>
    </TableContainer>
}

export default OrderLinesSummary