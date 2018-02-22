const notification = require('./notification.model')
const strftime = require('strftime')
const eventService = require('./service')

class Timer {
  start(session) {
    try {
      const notification = JSON.parse(session.message.text.split('|')[1])
      const splitDate = notification.Date.split('-')
      const splitTime = notification.Time.split('-')
      const timeWhenInvoke = new Date(splitDate[2], splitDate[0] - 1, splitDate[1], splitTime[0], splitTime[1])
      const timeNow = new Date()
      const timeToInvoke = timeWhenInvoke - Date.now()
      eventService.returnCreateEvent()
      setTimeout(() => {
        session.send(notification.Description)
      }, timeToInvoke)
    } catch (error) {
      session.send('Some error in message format, please recheck it and try again')
    }
  }
}

module.exports = new Timer()