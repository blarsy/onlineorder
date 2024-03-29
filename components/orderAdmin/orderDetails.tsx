import { Box, Paper, Typography } from "@mui/material"
import { OrderData } from "../../lib/common"
import { EnrichedSalesCycle } from "../../lib/form/salesCycleCache"
import DeliveryPreferences from "../orderCreate/deliveryPreferences"

const ALT_COLOR = '#CCC'

interface Props {
    enrichedSalesCycle: EnrichedSalesCycle,
    order: OrderData
}

const OrderDetails = ({ order, enrichedSalesCycle }: Props) => {
    let orderLinesElements : JSX.Element[] = []
    if(order.quantities.length > 0) {
        orderLinesElements.push(...[
            <Typography key="h1" textAlign="center" variant="h6" sx={{ flex: '0 0 100%' }}>Produits Coop</Typography>,
            <Typography key="h2" variant="overline" sx={{ flex: '0 0 15%', backgroundColor: ALT_COLOR }}>Catégorie</Typography>,
            <Typography key="h3" variant="overline" sx={{ flex: '0 0 35%', backgroundColor: ALT_COLOR }}>Nom</Typography>,
            <Typography key="h4" variant="overline" sx={{ flex: '0 0 15%', backgroundColor: ALT_COLOR }}>Unité</Typography>,
            <Typography key="h5" variant="overline" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Quantité</Typography>,
            <Typography key="h6" variant="overline" textAlign="right" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Prix</Typography>,
            <Typography key="h7" variant="overline" textAlign="right" sx={{ flex: '0 0 15%', backgroundColor: ALT_COLOR }}>Total</Typography>,
        ])
        order.quantities.forEach((quantity, idx) => {
            const product = enrichedSalesCycle!.productsById[quantity.productId].product
            const altColor = idx % 2 == 1 ? ALT_COLOR : 'inherit'
            orderLinesElements.push(...[
                <Typography key={`p${idx}-1`} variant="body2" sx={{ flex: '0 0 15%', backgroundColor: altColor }}>{product.category}</Typography>,
                <Typography key={`p${idx}-2`} variant="body2" sx={{ flex: '0 0 35%', backgroundColor: altColor }}>{product.name}</Typography>,
                <Typography key={`p${idx}-3`} variant="body2" sx={{ flex: '0 0 15%', backgroundColor: altColor }}>{product.unit}</Typography>,
                <Typography key={`p${idx}-4`} variant="body2" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{quantity.quantity}</Typography>,
                <Typography key={`p${idx}-5`} variant="body2" textAlign="right" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{product.price.toFixed(2)}€</Typography>,
                <Typography key={`p${idx}-6`} variant="body2" textAlign="right" sx={{ flex: '0 0 15%', backgroundColor: altColor }}>{(quantity.quantity * product.price).toFixed(2)}€</Typography>,
            ])
        })
    }

    if(order.quantitiesNonLocal.length > 0){
        orderLinesElements.push(...[
            <Typography key="hnl1" textAlign="center" variant="h6" sx={{ flex: '0 0 100%' }}>Produits HORS Coop</Typography>,
            <Typography key="hnl2" variant="overline" sx={{ flex: '0 0 15%', backgroundColor: ALT_COLOR }}>Catégorie</Typography>,
            <Typography key="hnl3" variant="overline" sx={{ flex: '0 0 30%', backgroundColor: ALT_COLOR }}>Nom</Typography>,
            <Typography key="hnl4" variant="overline" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Unité</Typography>,
            <Typography key="hnl5" variant="overline" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Condition.</Typography>,
            <Typography key="hnl6" variant="overline" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Quantité</Typography>,
            <Typography key="hnl7" variant="overline" textAlign="right" sx={{ flex: '0 0 10%', backgroundColor: ALT_COLOR }}>Prix/unité</Typography>,
            <Typography key="hnl8" variant="overline" textAlign="right" sx={{ flex: '0 0 15%', backgroundColor: ALT_COLOR }}>Total</Typography>,
        ])

        order.quantitiesNonLocal.forEach((quantity, idx) => {
            const product = enrichedSalesCycle!.nonLocalProductsById[quantity.productId]
            const altColor = idx % 2 == 1 ? ALT_COLOR : 'inherit'
            orderLinesElements.push(...[
                <Typography key={`pnl${idx}-1`} variant="body2" sx={{ flex: '0 0 15%', backgroundColor: altColor }}>{product.category}</Typography>,
                <Typography key={`pnl${idx}-2`} variant="body2" sx={{ flex: '0 0 30%', backgroundColor: altColor }}>{product.name}</Typography>,
                <Typography key={`pnl${idx}-3`} variant="body2" textAlign="center" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{product.unit}</Typography>,
                <Typography key={`pnl${idx}-4`} variant="body2" textAlign="center" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{product.packaging} {product.unit}</Typography>,
                <Typography key={`pnl${idx}-5`} variant="body2" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{quantity.quantity}</Typography>,
                <Typography key={`pnl${idx}-6`} variant="body2" textAlign="right" sx={{ flex: '0 0 10%', backgroundColor: altColor }}>{product.price.toFixed(2)}€</Typography>,
                <Typography key={`pnl${idx}-7`} variant="body2" textAlign="right" sx={{ flex: '0 0 15%', backgroundColor: altColor }}>{(quantity.quantity * product.packaging * product.price).toFixed(2)}€</Typography>,
            ])
        })
    }

    return <Box component={Paper} display="flex" flexDirection="row" flexWrap="wrap" sx={{ flex: '0 0 100%', padding: '1rem' }}>
        <DeliveryPreferences salesCycle={enrichedSalesCycle.salesCycle} order={order} />
        <Typography sx={{ flex: '0 0 100%'}} variant="body1">Note du client: {order.note}</Typography>
        { orderLinesElements }
    </Box>
}

export default OrderDetails