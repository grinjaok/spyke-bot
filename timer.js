const eventModel = require('./event.model')
const strftime = require('strftime')
const eventService = require('./service')

class Timer {
  start(session) {
    try {
      const event = this.modelBind(session)
      eventService.returnCreateEvent(event)
      const timeToInvoke = this.timeCalculation(event)
      this.setTimer(event, session, timeToInvoke)
    } catch (error) {
      session.send('Some error in message format, please recheck it and try again')
    }
  }

  async serverAwake() {
    const ongoingEvents = await eventService.returnFindEvent({IsEnded: false})
    ongoingEvents.forEach(event => {
      const timeToInvoke = this.timeCalculation(event)
      if (timeToInvoke > 0) {
        console.log(event) // need to start bot dialog and feed him parsed session
      } else {
        eventService.returnUpdateEvent(event.id, {$set:{IsEnded:true}},)
      }
    })
  }

  modelBind(session) {
    const event = new eventModel(JSON.parse(session.message.text.split('|')[1]))
    event.Session = JSON.stringify(session)
    event.UserCreated = 'newUser' //take from session user name
    return event
  }

  timeCalculation(event) {
    const splitDate = event.Date.split('-')
    const splitTime = event.Time.split('-')
    const timeWhenInvoke = new Date(splitDate[2], splitDate[0] - 1, splitDate[1], splitTime[0], splitTime[1])
    const timeNow = new Date()
    return timeWhenInvoke - Date.now()
  }

  setTimer(event, session, timeToInvoke) {
    setTimeout(() => {
      session.send(event.Description)
      eventService.returnUpdateEvent(event.id, {$set:{IsEnded:true}},)
    }, timeToInvoke)
  }
}


module.exports = new Timer()