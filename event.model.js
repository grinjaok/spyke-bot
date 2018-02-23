const mongoose = require('mongoose')
const Schema = mongoose.Schema


const NotificationModel = new Schema({
  Time: {
    type: String,
    required: 'no time'
  },
  Date: {
    type: String,
    required: 'no date'
  },
  Description: {
    type: String,
    required: 'no description'
  },
  Address: {
    type: String,
    required: 'no address'
  },
  UserCreated: {
    type: String,
    required: 'no user'
  },
  IsEnded: {
    type: Boolean,
    default: false
  },
  DateCreated: {
    type: Date,
    default: Date.now
  },
})

module.exports = mongoose.model('Events', NotificationModel);