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
  Session: {
    type: String,
    required: 'no session'
  },
  Status: {
    type: [{
      type: String,
      enum: ['ongoing', 'completed']
    }],
    default: ['ongoing']
  },
  DateCreated: {
    type: Date,
    default: Date.now
  },
})

module.exports = mongoose.model('Events', NotificationModel);