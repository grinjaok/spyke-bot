'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema


const UserTimezoneModel = new Schema({
  userName: {
    type: String,
    default: 'no user name'
  },
  userId: {
    type: String,
    default: 'no id'
  },
  timeOffset: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('UserTimezone', UserTimezoneModel);