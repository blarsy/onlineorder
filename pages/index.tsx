import type { NextPage } from 'next'
import Image from 'next/image'
import { Link, Box, Typography } from '@mui/material'

const Home: NextPage = () => {
  return (
    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='space-evenly' flexGrow='1'>
        <Link color='CaptionText' href="https://coopalimentaire.be/" underline='none' display='flex' alignItems='center'>
          <Image src='/Logo-header.png' width={100} height={100}/>
          <Typography textAlign='center' variant='h3'>La Coop alimentaire</Typography>
        </Link>
        <Typography textAlign='center' variant='h4'>Pour entrer ici, il vous faut un numéro de client ...</Typography>
    </Box>
  )
}

export default Home
