import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material"
import { EnrichedSalesCycle } from "../../lib/salesCycleCache"
import { ProductsQuantities } from "./types"

interface Props {
    totalHtva: number
}

const OrderSummary = ({ totalHtva }: Props) => {
    const tva = totalHtva * 0.06
    return <TableContainer component={Paper}>
        <Table>
        <TableHead sx={{ backgroundColor: '#CCC'}}>
            <TableRow>
                <TableCell align="right">Total HTVA</TableCell>
                <TableCell align="right">TVA</TableCell>
                <TableCell align="right">Total TVAC</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            <TableRow>
                <TableCell align="right">{totalHtva.toFixed(2)}€</TableCell>
                <TableCell align="right">{tva.toFixed(2)}€</TableCell>
                <TableCell align="right">{(totalHtva + tva).toFixed(2)}€</TableCell>
            </TableRow>
        </TableBody>
        </Table>
    </TableContainer>
}

export default OrderSummary