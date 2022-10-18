import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { ProductsById } from "../../../lib/salesCycleCache"
import { ProductsQuantities } from "../types"

interface Props {
    productIds:  number[],
    productsById: ProductsById,
    touched: FormikTouched<ProductsQuantities>,
    errors: FormikErrors<ProductsQuantities>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: ProductsQuantities
}

const ProductsOrderTable = ({ productIds, productsById, touched, errors, getFieldProps, values } : Props) => {
    const productId = ``
    return <TableContainer component={Paper}>
        <Table size="small">
        <TableHead sx={{ backgroundColor: '#CCC' }}>
            <TableRow>
                <TableCell>Produits</TableCell>
                <TableCell align="right">Unité</TableCell>
                <TableCell align="right">Prix par unité</TableCell>
                <TableCell align="right">Quantité dispo</TableCell>
                <TableCell align="right">Votre quantité</TableCell>
                <TableCell align="right">Votre prix</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {productIds.map((productId, index) => {
                const productInfo = productsById[productId]
                const product = productInfo.product
                return <TableRow key={index}>
                    <TableCell component="th" scope="row">{product.name}</TableCell>
                    <TableCell align="right">{product.unit}</TableCell>
                    <TableCell align="right">{product.price.toFixed(2)}€</TableCell>
                    <TableCell align="right">{productInfo.updatedQuantity}</TableCell>
                    <TableCell align="right">
                        <TextField size="small"
                            id={productId.toString()} error={touched[productId] && !!errors[product.id]}
                            helperText={errors[productId]}
                            {...getFieldProps(productId.toString())}
                            sx={{ width: '5rem', 
                                '& .MuiOutlinedInput-input':{
                                    textAlign: 'right', 
                                    padding: '0 3px'
                            } }} />
                    </TableCell>
                    <TableCell align="right">{!errors[productId] && `${Number(values[productId] * product.price).toFixed(2)}€`}</TableCell>
                </TableRow>
            })}
        </TableBody>
        </Table>
    </TableContainer>
}

export default ProductsOrderTable