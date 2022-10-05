import Head from 'next/head'
import Image from 'next/image'
import { Box, Container } from '@mui/material'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Container sx={{ minHeight: '100vh', display: 'flex', flexFlow: 'column nowrap', padding: 0 }}>
      <Head>
        <title>La Coop alimentaire, prise de commande</title>
        <meta name="description" content="La Coop alimentaire, prise de commande" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box display='flex' flexDirection='column' sx={{flexGrow: '1'}}>
        <Component {...pageProps}/>
      </Box>
    </Container>
}

export default MyApp
