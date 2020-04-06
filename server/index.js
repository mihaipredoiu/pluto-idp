'use strict'

const express = require('express')
var session = require('express-session')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const app = express()
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))
app.use(express.json())

const PORT = 8080

// Connect to MongoDB
mongoose
  .connect(
    'mongodb://database:27017/',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err))

const User = require('./data/models/Users.js')
const Restaurant = require('./data/models/Restaurants.js')

String.prototype.hashCode = function () {
  let hash = 0
  if (this.length == 0) return hash
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}


app.get('/', async (req, res) => {
  if (req.session.loggedin) {
    res.send('Bine ai venit in aplicatie')
  } else {
    res.send('Trebuie sa te loghezi')
  }
})

app.get('/api/users', async (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
    const users = await User.find({})
    res.send(users)
  } else {
    res.status(401).send('Forbidden')
  }
})

app.delete('/api/users', async (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
    const users = await User.deleteMany({ role: { $ne: "admin" } })
    res.send(`Deleted ${users.deletedCount} users.`)
  } else {
    res.status(401).send('Forbidden')
  }
})

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params

  if (req.session.loggedin && req.session.role === 'admin') {
    const users = await User.findOneAndRemove({ _id: id, role: { $ne: "admin" } }, { useFindAndModify: false })
    if (users) {
      res.send(`Deleted one users.`)
    } else {
      res.send(`No user deleted.`)
    }
  } else {
    res.status(401).send('Forbidden')
  }
})

app.post('/api/users/register', async (req, res) => {
  const { username, password, role } = req.body
  try {
    const hash = password.hashCode()
    const currentUser = await User.findOne({ username })
    if (currentUser) {
      res.status(500).send('Username already exists in database')
    } else {
      const newUser = await new User({
        username,
        password: hash,
        role
      })

      const newRestaurant = await new Restaurant({
        userId: newUser.id
      })

      newUser.save()
        .then(() => {
          newRestaurant.save()
            .then(() => res.send('success'))
            .catch(e => res.status(500).send(e.message))
        })
        .catch(e => res.status(500).send(e.message))
    }
  }
  catch (err) {
    console.log(err)
  }
})

app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  if (user && password.hashCode() !== user.password) {
    req.session.loggedin = true
    req.session.username = username
    req.session.role = user.role
    req.session._id = user.id

    res.send('success')
  } else {
    res.status(401).send('Wrong username or password.')
  }
})

app.put('/api/restaurants', async (req, res) => {
  const { id, role } = req.session
  if (req.session.loggedin && role === 'restaurant') {
    Restaurant.findOneAndUpdate({ userId: id }, { $push: { menu: req.body } }, { upsert: true, useFindAndModify: false }, function (err, doc) {
      if (err)
        res.status(500)
      return res.send('Succesfully saved.')
    })
  } else {
    res.status(500).send('Forbidden')
  }
})

app.delete('/api/restaurants', async (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
    const restaurants = await Restaurant.deleteMany({})
    res.send(`Deleted ${restaurants.deletedCount} restaurants.`)
  } else {
    res.status(401).send('Forbidden')
  }
})

app.delete('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params

  if (req.session.loggedin && req.session.role === 'admin') {
    const users = await Restaurant.findOneAndRemove({ _id: id }, { useFindAndModify: false })
    if (users) {
      res.send(`Deleted one restaurant.`)
    } else {
      res.send(`No restaurant deleted.`)
    }
  } else {
    res.status(401).send('Forbidden')
  }
})

app.get('/api/restaurants', async (req, res) => {
  const restaurant = await Restaurant.find({})
  res.send(restaurant)
})

app.listen(PORT, () => console.log(`App is listening on port ${PORT}!`))