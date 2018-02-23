const eventModel = require('./event.model')
const eventService = require('./service')
const fiveMinutes = 1000 * 60 * 5

class EventPlaner {
  start(session) {
    try {
      const event = this.modelBind(session)
      eventService.returnCreateEvent(event)
    } catch (error) {
      session.send('Some error in message format, please recheck it and try again')
    }
  }

  async comingEvents() {
    try {
      const ongoingEvents = await eventService.returnFindEvent({ IsEnded: false })
      ongoingEvents.forEach(event => {
        const timeToInvoke = this.timeCalculation(event)
        if (timeToInvoke > 0 && timeToInvoke < fiveMinutes) {
          console.log(event) // need to start bot dialog and feed him parsed session
          eventService.returnUpdateEvent({ _id: event.id }, { $set: { IsEnded: true } } )
        }
        if (timeToInvoke < 0) {
          eventService.returnUpdateEvent({ _id: event.id }, { $set: { IsEnded: true } } )
        }
      })
    } catch (error) {
      //log error
      console.log(error)
    }
  }

  modelBind(session) {
    try {
      const parsedMessage = JSON.parse(session.message.text.split('|')[1])
      const event = new eventModel(parsedMessage)
      event.Session = JSON.stringify(session)
      event.UserCreated = 'newUser' //take from session user name
      return event
    } catch (error) {
      session.send('Can not parse you message')
    }
  }

  timeCalculation (event) {
    try {
      const splitDate = event.Date.split('-')
      const splitTime = event.Time.split('-')
      const year = splitDate[2]
      const month = +splitDate[0] - 1
      const day = splitDate[1]
      const hours = splitTime[0]
      const minutes = splitTime[1]
      const timeWhenInvoke = new Date(year, month, day, hours, minutes)
      const timeNow = new Date()
      return timeWhenInvoke - Date.now()
    } catch (error) {
      //log error
    }
  }
}

module.exports = new EventPlaner()