import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField } from "@mui/material"
import { FormikTouched, FormikErrors, FieldInputProps } from 'formik'
import { NonLocalProductData } from "../../lib/common"
import { ProductsQuantities } from "../../lib/form/formCommon"

interface Props {
    products: NonLocalProductData[],
    touched: FormikTouched<ProductsQuantities>,
    errors: FormikErrors<ProductsQuantities>,
    getFieldProps: <Value = any>(props: any) => FieldInputProps<Value>,
    values: ProductsQuantities
}

const NonLocalProductsOrderTable = ({ products, touched, errors, getFieldProps, values } : Props) => {
    const productId = ``
    return <TableContainer component={Paper}>
        <Table size="small">
        <TableHead sx={{ backgroundColor: '#CCC' }}>
            <TableRow>
                <TableCell>Produits</TableCell>
                <TableCell align="right">Unité</TableCell>
                <TableCell align="right">Prix par unité</TableCell>
                <TableCell align="right">Conditionnement</TableCell>
                <TableCell align="right">Votre quantité</TableCell>
                <TableCell align="right">Votre prix</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {products.map((product, index) => {
                const formattedId = `nl${product.id}`
                return <TableRow key={index}>
                    <TableCell component="th" scope="row">{product.name}</TableCell>
                    <TableCell align="right">{product.unit}</TableCell>
                    <TableCell align="right">{product.price.toFixed(2)}€</TableCell>
                    <TableCell align="right">{product.packaging} {product.unit}</TableCell>
                    <TableCell align="right">
                        <TextField size="small"
                            id={formattedId} error={touched[formattedId] && !!errors[formattedId]}
                            helperText={errors[formattedId]}
                            {...getFieldProps(formattedId)}
                            sx={{ width: '5rem', 
                                '& .MuiOutlinedInput-input':{
                                    textAlign: 'right', 
                                    padding: '0 3px'
                            } }} />
                    </TableCell>
                    <TableCell align="right">{!errors[formattedId] && `${Number(values[formattedId] * Number(product.packaging) * product.price).toFixed(2)}€`}</TableCell>
                </TableRow>
            })}
        </TableBody>
        </Table>
    </TableContainer>
}

export default NonLocalProductsOrderTable