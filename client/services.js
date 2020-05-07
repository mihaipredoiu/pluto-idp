const axios = require('axios')

axios.defaults.withCredentials = true
axios.defaults.headers.common['Access-Control-Allow-Credentials'] = true
axios.defaults.headers.common['connection'] = 'keep-alive'

module.exports = {
  status: async (token) => {
    try {
      const res = await axios.get('http://localhost:8080/api/status', {
        headers: { Authorization: 'Bearer ' + token }
      })
      return `\nLogged in as ${res.data.username}`
    }
    catch (e) {
      return `Not logged in`
    }
  },

  register: async (username, password, role) => {
    try {
      const res = await axios.post('http://localhost:8080/api/users/register', {
        username,
        password,
        role
      })
      return res.data
    }
    catch (e) {
      return e
    }
  },

  login: async (username, password) => {
    try {
      const res = await axios.post('http://localhost:8080/api/users/login', {
        username,
        password
      })
      return res.data
    }
    catch (e) {
      return e
    }
  },

  getRestaurants: async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/restaurants')

      return res.data
    }
    catch (e) {
      return e
    }
  },

  getRestaurant: async (id) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/restaurants/${id}`)

      return res.data
    }
    catch (e) {
      return e
    }
  },

  addProduct: async (name, price, description, id) => {
    try {
      const res = await axios.put(`http://localhost:8080/api/restaurants/${id}`, [{
        name,
        price,
        description
      }])
      return res.data
    }
    catch (e) {
      return e
    }
  },

  addOrder: async (clientId, restaurantId, cart) => {
    try {
      const res = await axios.post(`http://localhost:8080/api/orders`, {
        clientId,
        restaurantId,
        cart
      })
      return res.data
    }
    catch (e) {
      return e
    }
  },

  getRestaurantOrders: async (id) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/orders/${id}`)
      return res.data
    }
    catch (e) {
      return e
    }
  },
}