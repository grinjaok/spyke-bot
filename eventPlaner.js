'use strict'
const EventEmitter = require('events')
const eventModel = require('./event.model')
const eventService = require('./eventService')
const moment = require('moment')
const fiveMinutes = 1000 * 60 * 5
const halfAnHour = 1000 * 60 * 30
class EventPlaner extends EventEmitter {

  constructor() {
    super()
    this.comingEvents = this.comingEvents.bind(this)
  }

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
      const ongoingEvents = await eventService.returnFindEvent({ isEnded: false })
      ongoingEvents.forEach(event => {
        const timeToInvoke = this.timeCalculation(event)
        if (timeToInvoke > 0 && timeToInvoke < fiveMinutes) {
          this.emit('sendNotification', event)
          eventService.returnUpdateEvent({ _id: event.id }, { $set: { isEnded: true } })
        }

        if (timeToInvoke < 0) {
          eventService.returnUpdateEvent({ _id: event.id }, { $set: { isEnded: true } })
        }
      })
    } catch (error) {
      //log error
    }
  }

  modelBind(session) {
    try {
      const event = new eventModel(session.dialogData)
      event.address = JSON.stringify(session.message.address)
      event.userCreated = session.message.user.name
      event.userTimeOffset = session.dialogData.timeOffset
      const newTime = new Date(event.eventDate)
      newTime.setHours(newTime.getHours() - event.userTimeOffset)
      event.eventDate = newTime.toString()
      return event
    } catch (error) {
      session.send('Can not parse you message')
    }
  }

  timeCalculation(event) {
    try {
      const timeWhenInvoke = new Date(event.eventDate)
      const timeNow = new Date()
      return timeWhenInvoke - Date.now()
    } catch (error) {
      //log error
    }
  }

  convertSelectedDateToEventDate(session) {
    const dateNow = new Date()
    const year = dateNow.getFullYear()
    const month = dateNow.getMonth()
    const day = dateNow.getDate() + session.dialogData.eventDayOffset
    const hours = +session.dialogData.eventTime.split(':')[0]
    const minutes = +session.dialogData.eventTime.split(':')[1]
    const seconds = 0
    return new Date(year, month, day, hours, minutes, seconds)
  }

  getCloseTime(session) {
    const timeArray = []
    const dateNow = new Date()
    dateNow.setHours(dateNow.getHours() + session.dialogData.timeOffset)
    if (dateNow.getMinutes() < 30) {
      timeArray.push(new Date(dateNow.setMinutes(30)))
      timeArray.push(this.addMinutes(dateNow, 30))
      timeArray.push(this.addMinutes(dateNow, 60))
      timeArray.push(this.addMinutes(dateNow, 90))
    } else {
      dateNow.setMinutes(0)
      timeArray.push(new Date(dateNow.setHours(dateNow.getHours() + 1)))
      timeArray.push(this.addMinutes(dateNow, 30))
      timeArray.push(this.addMinutes(dateNow, 60))
      timeArray.push(this.addMinutes(dateNow, 90))
    }
    return timeArray
  }

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }
}

module.exports = new EventPlaner()