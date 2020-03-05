'use strict'

const express = require('express')

const { PORT = '8080' } = process.env
const app = express()

app.get('/', (req, res) => {
  res.send('GET request to homepage')
})

app.post('/', (req, res) => {
  res.send('POST request to homepage')
})

app.get('/api/users', (req, res) => {
  res.send('request to GET all users')
})

app.post('/api/users', (req, res) => {
  res.send('request to add one user users')
})

app.listen(PORT, () => console.log(`App is listening on port ${PORT}!`))