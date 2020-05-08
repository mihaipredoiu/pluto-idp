'use strict'

const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const cors = require('cors')
const axios = require('axios')
const jwt = require('jsonwebtoken');
const promMid = require('express-prometheus-middleware');

const app = express()

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))
app.use(express.json())

app.use(cors({
  credentials: true, // enable set cookie
}));

app.use(promMid({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5],
}));

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
  .then(() => console.log('✅ Server connected to database'))
  .catch(err => console.log(err))

const User = require('./data/models/Users.js')
const Restaurant = require('./data/models/Restaurants.js')
const Order = require('./data/models/Orders.js')

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


app.get('/api/status', async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = await jwt.verify(token, 'ultrasecretkey')

    res.send({ username: decoded.username })
  }
  catch (e) {
    res.status(401).send()
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  }
  catch (e) {
    res.status(500).send()
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

      console.log('New User:\n', newUser)

      newUser.save()
        .then(async () => {
          if (role === 'restaurant') {
            const newRestaurant = await new Restaurant({
              userId: newUser._id
            })
            newRestaurant.save()
              .then(() => res.send('User registered sucessfully'))
              .catch(e => res.status(500).send(e.message))
          } else {
            res.send('User registered sucessfully')
          }

        })
        .catch(e => res.status(500).send(e.message))
    }
  }
  catch (e) {
    res.status(500).send(e.message)
  }
})

app.post('/api/orders', async (req, res) => {
  const { clientId, restaurantId, cart } = req.body

  try {
    const newOrder = await new Order({
      clientId, restaurantId, cart
    })

    newOrder.save()
      .then(() => {
        axios.post('http://notifier:8082/api/notify', { email: 'predoiumihai@gmail.com', receipt: cart.map(item => ({ productName: item.name, price: item.price })) })
        console.log(cart)
        res.send('Order registered sucessfully')
      })
      .catch(e => {
        console.log(e)
        res.status(500).send(e.message)
      })
  }
  catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
})

app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params

  try {
    const restaurant = await Restaurant.findOne({ userId: id })

    const orders = await Order.find({ restaurantId: restaurant.id })

    if (orders) {
      res.send(orders)
    } else {
      res.status(404).send()
    }
  }
  catch (e) {
    console.log(e)
    res.status(404).send()
  }
})

app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({})
  console.log(orders)
  if (orders) {
    res.send(orders)
  } else {
    res.status(404).send()
  }
})

app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })
    if (user && password.hashCode() !== user.password) {
      const token = await jwt.sign({ username, password }, 'ultrasecretkey')

      return res.send({ token, role: user.role, _id: user._id })
    } else {
      res.status(401).send('Wrong username or password.')
    }
  }
  catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }

})

app.put('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params
  Restaurant.findOneAndUpdate({ userId: id }, { $push: { menu: req.body } }, { upsert: true, useFindAndModify: false }, function (err, doc) {
    if (err)
      res.status(500)
    return res.send('Succesfully saved.')
  })

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

app.get('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params

  const restaurant = await Restaurant.findOne({ userId: id })
  if (restaurant) {
    res.send(restaurant)
  } else {
    res.status(404).send()
  }
})

app.get('/api/restaurants', async (req, res) => {
  const restaurants = await Restaurant.find({})
  const result = await Promise.all(restaurants.map(async rest => {
    const user = await User.findOne({ _id: rest.userId })
    return {
      _id: rest._id,
      menu: rest.menu,
      isOpened: rest.isOpened,
      name: user.username,
      userId: rest.userId
    }
  }))

  res.send(result)
})

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}!`))