const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'client', 'restaurant']
    }

}, { timestamps: true })

const UserModel = mongoose.model('Users', UserSchema)

module.exports = UserModel
