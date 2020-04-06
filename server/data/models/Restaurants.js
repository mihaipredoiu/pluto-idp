const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: false
  }
})


const RestaurantSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  menu: [ProductSchema],
  isOpened: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

const RestaurantModel = mongoose.model('Restaurants', RestaurantSchema)

module.exports = RestaurantModel
