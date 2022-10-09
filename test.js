const searchFiles = async () => {
  const { GoogleAuth } = require('google-auth-library')
  const creds = require('./google-creds.json')
  const { google } = require ('googleapis')
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/drive',
    credentials: creds
  })
  const service = google.drive({version: 'v3', auth})
  try {
    const res = await service.files.list({
      q: 'name = \'Coop\' and mimeType=\'application/vnd.google-apps.folder\'',
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    })
    if(res.data.files) {
      res.data.files.forEach(function(file) {
          console.log('Found file:', file.name, file.id)
        })
    }
    return res.data.files
  } catch (err) {
    // TODO(developer) - Handle error
    throw err
  }
}

const getAvailableProducts = async () => {
    const { GoogleSpreadsheet } = require('google-spreadsheet')

    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet('1do3iJhMD_k_zg0UnFCEhAaEEwtVMM8aeFYDX4mRG8S4')
    
    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
      // env var values are copied from service account credentials generated by google
      // see "Authentication" section in docs for more info
      client_email: 'ordermodule@coopalimentaire.iam.gserviceaccount.com',//process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCM7B9KwxRnpXhr\nDVLTjrXpComDXd3jBgxbSk4TE6LMBgR0aSoQAo4rqjnuJipy856UMa2+vhE9U8gO\neSuE4joMBAePT1WlqnXquvVsyGkaBRTr8yj7TIHS1O2Gd4YZQmdRFUiDz53eq/gG\naxFH8KpcKAp5mS5J0GBTrLuyMheycmYpnFjJ5+V20tpvqJV7kEkNvcukFKqHbCIr\nLnInXWQSOUU3/FO7k2LXc5QymKGv0eBPKjkTB3XWLse3xkbppQBeUGbMpcznEaKb\njFSUeJ40gyx/6o45NcOvKM803HdgnYwvCRXMmKLzZA2Zbbqdfkd6jfnZuxSZpyVO\nVK19i6mJAgMBAAECggEACnKYCFAps1x0bsVcWmRmbqpSExvyrxnb8SmzW501UNhy\nXJoOXQT/etPCOzp3o7GVlGmRdsZ7GzeaqZ4IoK+v+4OR9uk8EY3vc5FcUC4UgrIV\nQL/0jhr4NgQEvxcd6UH/zGZeS61pCCDqQLmP3KxGSRJL4oN9h8nr1lBEUxv9H0TZ\nTcqN0iwJflGukhK22SJ70vEgrHt4yXU5VA74acCIgxT5OIjDtUb8wxrFb+jDd4+t\nnhC7NrVVtySvauRtFp1Wc2nXsesMey8czWendZyCP0mYtFIwssOMwsxCT07Aujch\nL2xMDB6rRuT63FrLBQ9D2V6zLf3fpBhvmMDy18cHAQKBgQC+gDhyFQelNdpIHiRr\nWkVOj4Jbfn2cABlfZmsCuCDa23gH748zANVdxGc/iXOw76m/cfJIgelo+qfnZWIo\n9qhQinPgRcp20jNDoy/vl/eXbaYONTnRIYTVsmVnvjTbjCkh38zfKi5Qc/UFgcRT\nRLbiNJpdVuxtksvW4nNShT8bCQKBgQC9YAdwsuhbNiW+mlES9+AdhYuVk4DwlDR9\nSLS12qUK8//Umo4f2EAr3+YrPPN/tB96YdSD3FB9ga9j9bhoBug9gbskQyOoDW9D\n0k8ZCP4rQtkPzokdrEJtb4En6u9Q2x07+vzAcgkyUKIB5ab8lNeF6BkEfqRc7A9/\nTmlxzGc6gQKBgFdxvfdIBfllLex6wZbxmezE3T6oYnowZXUwKyDVamdr5L4nzeDI\nmihvlkFJE+z9Jjs1z9ROpdjFbjs+g39wMbS+yRACmTxPoq6CgueFJ2bAM0BEWGTR\n8Qqy1+92FQdOYDcnZwBteVL+11MOzRK38QcGxHDiDKcDgkQCMJOJjH0ZAoGBAJvm\n75kfIFze0en9XttPx2hmZciI+3CTgjbV4TeJPbAruaSMbI7Y19OG6xUTg57Racy1\nt1+qw3Tfi8WuJ9c0QINKRweOYk9aaAwcmlOQ7LYuvUXfEVClXLZ9QoXbSpN1H7ce\nZHAGMX4DlawcJQHxgxDRR69ElwmMqSF0KyitTxqBAoGBAKvWW2xBGkCr0ERZVAxe\nhIBB5j4PzI+LWkNNqND1FjpYxwxy5FYT5OvSPUb06dh7C6EZ2LWlCW6MryFRQa+U\nYmch7+738SNKxoiEzGHPLHHDSOyvR4x9GT4WngnRwrOjj1OE5l5Y1lF39aZba0cu\ncwr/6SXyPQwiIkFYzyodCgxc\n-----END PRIVATE KEY-----\ns',
    })

    await doc.loadInfo() // loads document properties and worksheets
    
    
    const sheet = doc.sheetsByTitle['Produits'] // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
    await sheet.loadCells()
    
    const availableProducts = []
    let i = 0, name = 'dummy', price, unit
    while(name) {
        name = sheet.getCell(i, 1).value
        quantity = sheet.getCell(i, 3).value
        price = sheet.getCell(i, 7).value
        unit = sheet.getCell(i, 2).value
        if(name && quantity > 0) {
          availableProducts.push({name, quantity, price, unit})
        }
        i ++
    }
    return availableProducts
}

Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}
Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.getWeekBounds = function() {
  const todayMidnight = new Date(this)
  todayMidnight.setHours(0,0,0,0)
  let i = 0
  while(todayMidnight.addDays(i).getDay() != 1){
    i--
  }
  const beginWeek = todayMidnight.addDays(i).toLocaleDateString('fr-BE')
  i = 0
  while(todayMidnight.addDays(i).getDay() != 0){
    i++
  }
  return [beginWeek, todayMidnight.addDays(i).toLocaleDateString('fr-BE')]
}

const main = async () => {
    console.log(new Date(2022,9,10,0,0,0,0).getWeekBounds())
}

main().then(() => console.log('done'))
