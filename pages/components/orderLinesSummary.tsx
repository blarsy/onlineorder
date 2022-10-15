import { OrderData } from "../../lib/common"
import { Stack, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material"

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
    const quantitiesNonLocalPerCategory: {
        [category: string]: {
            productName: string,
            quantity: number,
            unit: string,
            price: number,
            packaging: number
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
    order.quantitiesNonLocal.forEach(quantity => {
        const dataToAdd = {
            productName: quantity.productName,
            quantity: quantity.quantity,
            unit: quantity.unit,
            price: quantity.price,
            packaging: quantity.packaging
        }
        if(quantitiesNonLocalPerCategory[quantity.category]){
            quantitiesNonLocalPerCategory[quantity.category].push(dataToAdd)
        } else {
            quantitiesNonLocalPerCategory[quantity.category] = [ dataToAdd ]
        }
    })
    return <Stack spacing={1}>
        <Typography variant="h6">Produits bios et locaux de la Coop</Typography>
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead sx={{ backgroundColor: '#CCC'}}>
                    <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Unité</TableCell>
                        <TableCell align="right">Prix/unité</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.keys(quantitiesPerCategory).map(category => {
                        return [<TableRow key={`cat${category}`}>
                            <TableCell colSpan={5} align="center"><Typography variant="overline">{category}</Typography></TableCell>
                        </TableRow>,
                        quantitiesPerCategory[category].map((quantity,idx) => <TableRow key={idx}>
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
        <Typography variant="h6">Produits bios non-locaux</Typography>
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead sx={{ backgroundColor: '#CCC'}}>
                    <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Unité</TableCell>
                        <TableCell align="right">Prix/unité</TableCell>
                        <TableCell align="right">Conditionnement</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.keys(quantitiesPerCategory).map(category => {
                        return [<TableRow key={`cat${category}`}>
                            <TableCell colSpan={5} align="center"><Typography variant="overline">{category}</Typography></TableCell>
                        </TableRow>,
                        quantitiesNonLocalPerCategory[category].map((quantity, idx) => <TableRow key={idx}>
                            <TableCell>{quantity.productName}</TableCell>
                            <TableCell align="right">{quantity.quantity}</TableCell>
                            <TableCell align="right">{quantity.unit}</TableCell>
                            <TableCell align="right">{quantity.price.toFixed(2)}€</TableCell>
                            <TableCell align="right">{quantity.packaging}€</TableCell>
                            <TableCell align="right">{(quantity.quantity * quantity.price * quantity.packaging).toFixed(2)}€</TableCell>
                        </TableRow>)]
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    </Stack>
}

export default OrderLinesSummary