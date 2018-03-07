'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema


const NotificationModel = new Schema({
  eventDate: {
    type: String,
    required: 'no date'
  },
  eventPlace: {
    type: String,
    required: 'no place'
  },
  eventDescription: {
    type: String,
    required: 'no description'
  },
  address: {
    type: String,
    required: 'no address'
  },
  userCreated: {
    type: String,
    default: 'no user'
  },
  isEnded: {
    type: Boolean,
    default: false
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  userTimeOffset: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('Events', NotificationModel);