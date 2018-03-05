'use strict'
const mongoose = require('mongoose')
const UserTimezone =  require('./userTimezone.model')

class UserTimezoneService {
  async returnFindTimezone (params = {}) {
    try {
      const result = await UserTimezone.find(params)
      return result
    } catch(error) {
      return new Error('error')
    }
  }
  
  async returnCreateTimezone (userTimezone) {
    try {
      const result = await userTimezone.save()
      return result
    } catch (error) {
      return new Error('error')
    }
  }
  
  async returnUpdateTimezone (id, value) {
    try {
      const result = await UserTimezone.findOneAndUpdate(id, value, { new: true })
      return result
    } catch (error) {
      return new Error('error')
    }
  }
  
  async returnDeleteTimezone (id) {
    try {
      const result = await UserTimezone.remove({_id: id})
    } catch (error) {
      return new Error('error')
    }
  }
}

module.exports = new UserTimezoneService()
