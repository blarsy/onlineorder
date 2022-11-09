import { NonLocalProductData, OrderData, ProductData } from "../../lib/common"
import { Stack, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material"
import { EnrichedSalesCycle } from "../../lib/salesCycleCache"

interface Props {
    order: OrderData,
    enrichedSalesCycle: EnrichedSalesCycle
}

const getProductsSummary = (quantitiesPerCategory: {[category: string]: {
    product: ProductData
    quantity: number }[]}) => {
    return [<Typography key="local-title" variant="h6">Produits bios et locaux de la Coop</Typography>,
        <TableContainer key="local-table" component={Paper}>
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
                            <TableCell>{quantity.product.name}</TableCell>
                            <TableCell align="right">{quantity.quantity}</TableCell>
                            <TableCell align="right">{quantity.product.unit}</TableCell>
                            <TableCell align="right">{quantity.product.price.toFixed(2)}€</TableCell>
                            <TableCell align="right">{(quantity.quantity * quantity.product.price).toFixed(2)}€</TableCell>
                        </TableRow>)]
                    })}
                </TableBody>
            </Table>
        </TableContainer>]
}

const getNonLocalProductsSummary = (quantitiesNonLocalPerCategory: {
    [category: string]: {
        product: NonLocalProductData
        quantity: number}[]}) => {
    return [<Typography key="nonlocal-title" variant="h6">Produits bios non-locaux</Typography>,
        <TableContainer key="nonlocal-table" component={Paper}>
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
                    {Object.keys(quantitiesNonLocalPerCategory).map(category => {
                        return [<TableRow key={`cat${category}`}>
                            <TableCell colSpan={6} align="center"><Typography variant="overline">{category}</Typography></TableCell>
                        </TableRow>,
                        quantitiesNonLocalPerCategory[category].map((quantity, idx) => <TableRow key={idx}>
                            <TableCell>{quantity.product.name}</TableCell>
                            <TableCell align="right">{quantity.quantity}</TableCell>
                            <TableCell align="right">{quantity.product.unit}</TableCell>
                            <TableCell align="right">{quantity.product.price.toFixed(2)}€</TableCell>
                            <TableCell align="right">{quantity.product.packaging}€</TableCell>
                            <TableCell align="right">{(quantity.quantity * quantity.product.price * quantity.product.packaging).toFixed(2)}€</TableCell>
                        </TableRow>)]
                    })}
                </TableBody>
            </Table>
        </TableContainer>]
}

const OrderLinesSummary = ({ order, enrichedSalesCycle }: Props) => {
    const quantitiesPerCategory: {
        [category: string]: {
            product: ProductData,
            quantity: number
        }[]
    } = {}
    const quantitiesNonLocalPerCategory: {
        [category: string]: {
            product: NonLocalProductData,
            quantity: number
        }[]
    } = {}
    order.quantities.forEach(quantity => {
        const productInfo = enrichedSalesCycle.productsById[quantity.productId]
        const dataToAdd = {
            product: productInfo.product,
            quantity: quantity.quantity
        }
        if(quantitiesPerCategory[productInfo.product.category]){
            quantitiesPerCategory[productInfo.product.category].push(dataToAdd)
        } else {
            quantitiesPerCategory[productInfo.product.category] = [dataToAdd]
        }
    })
    order.quantitiesNonLocal.forEach(quantity => {
        const product = enrichedSalesCycle.nonLocalProductsById[quantity.productId]
        const dataToAdd = {
            product,
            quantity: quantity.quantity
        }
        if(quantitiesNonLocalPerCategory[product.category]){
            quantitiesNonLocalPerCategory[product.category].push(dataToAdd)
        } else {
            quantitiesNonLocalPerCategory[product.category] = [ dataToAdd ]
        }
    })
    return <Stack spacing={1}>
        {order.quantities.length > 0 && getProductsSummary(quantitiesPerCategory)}
        {order.quantitiesNonLocal.length > 0 && getNonLocalProductsSummary(quantitiesNonLocalPerCategory)}
    </Stack>
}

export default OrderLinesSummary