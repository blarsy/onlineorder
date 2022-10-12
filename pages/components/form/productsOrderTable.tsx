import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { ProductData } from "../../../lib/common"
import { ProductsQuantities } from "../types"

interface Props {
    products: {
        product: ProductData,
        ctrlId: string
    }[],
    touched: FormikTouched<ProductsQuantities>,
    errors: FormikErrors<ProductsQuantities>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: ProductsQuantities
}

const ProductsOrderTable = ({ products, touched, errors, getFieldProps, values } : Props) => {
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
            {products.map((productRec, index) => (
            <TableRow key={index}>
                <TableCell component="th" scope="row">{productRec.product.name}</TableCell>
                <TableCell align="right">{productRec.product.unit}</TableCell>
                <TableCell align="right">{productRec.product.price.toFixed(2)}€</TableCell>
                <TableCell align="right">{productRec.product.quantity}</TableCell>
                <TableCell align="right">
                    <TextField size="small"
                        id={productRec.ctrlId} error={touched[productRec.ctrlId] && !!errors[productRec.ctrlId]}
                        helperText={errors[productRec.ctrlId]}
                        {...getFieldProps(productRec.ctrlId)}
                        sx={{ width: '5rem', 
                            '& .MuiOutlinedInput-input':{
                                textAlign: 'right', 
                                padding: '0 3px'
                        } }} />
                </TableCell>
                <TableCell align="right">{!errors[productRec.ctrlId] && `${Number(values[productRec.ctrlId] * productRec.product.price).toFixed(2)}€`}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </TableContainer>
}

export default ProductsOrderTable