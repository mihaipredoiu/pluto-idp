const mongoose = require('mongoose')

const Schema = mongoose.Schema

const OrderSchema = new Schema({
    clientId: {
        type: String,
        required: true
    },
    restaurantId: {
        type: String,
        required: true
    },
    cart: {
        type: Array,
        required: true
    }

}, { timestamps: true })

const OrderModel = mongoose.model('Orders', OrderSchema)

module.exports = OrderModel
