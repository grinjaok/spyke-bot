const mongoose = require('mongoose')
const Events =  require('./event.model')

class EventsService {
  async returnFindEvent (params = {}) {
    try {
      const result = await Events.find(params)
      return result
    } catch(error) {
      return new Error('error')
    }
  }
  
  async returnCreateEvent (event) {
    try {
      const result = await event.save()
      return result
    } catch (error) {
      return new Error('error')
    }
  }
  
  async returnUpdateEvent (id, value) {
    try {
      const result = await Events.findOneAndUpdate(id, value, { new: true })
      return result
    } catch (error) {
      return new Error('error')
    }
  }
  
  async returnDeleteEvent (id) {
    try {
      const result = await Events.remove({_id: id})
      return('event was removed')
    } catch (error) {
      return new Error('error')
    }
  }
}

module.exports = new EventsService()
