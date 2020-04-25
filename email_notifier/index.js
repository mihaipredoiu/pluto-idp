require('dotenv').config()

const express = require('express')
const nodemailer = require('nodemailer')
const fs = require('fs')

const app = express()
app.use(express.json())

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
})

app.post('/api/notify', async (req, res) => {
  const { email, receipt } = req.body

  fs.readFile('template.html', { encoding: 'utf-8' }, (err, html) => {
    if (err) {
      console.log(err)
    } else {
      const totalPrice = receipt.reduce((acc, item) => acc + item.price, 0)

      receipt.map(item => html += `<tr class='item last'><td>${item.productName}</td><td>${item.price}lei</td></tr>`)
      html += `<tr class='total'><td></td><td>Total: ${totalPrice}lei</td></tr></table></div></body></html>`

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Pluto IDP delivery receipt',
        html
      }

      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log('Error occured')
          return res.status(500).send('Error occured')
        } else {
          console.log('Email sent')
          return res.status(200).send('Email sent')
        }
      })
    }
  })
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`👂 Listening on: ${process.env.PORT || 3000}`)
)
