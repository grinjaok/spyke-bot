'use strict'
const restify = require('restify')
const builder = require('botbuilder')
const eventPlaner = require('./eventPlaner')
const mongoose = require('mongoose')
const strftime = require('strftime')
const userTimezoneService = require('./userTimezoneService')
const userTimezoneModel = require('./userTimezone.model')
const timezones = require('./timezone')
const botName = 'event-planner-skype-bot'
const twoMinutes = 2 * 60 * 1000

require('dotenv').config()

mongoose.Promise = global.Promise
mongoose.connect(process.env.COSMOSDB_CONNSTR, {
  auth: {
    user: process.env.COSMODB_USER,
    password: process.env.COSMODB_PASSWORD,
  }
})

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
const connector = new builder.ChatConnector({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
  openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector)

setInterval(eventPlaner.comingEvents, twoMinutes)

eventPlaner.on('sendNotification', (event) => {
  const address = JSON.parse(event.address)
  bot.beginDialog(address, 'sendNotification', event)
})

bot.dialog('/', [ 
  async (session, results, next) => {
    session.send("Welcome to event planning");
    const userTimezone = await userTimezoneService.returnFindTimezone({userId: session.message.user.id})
    if(userTimezone.length === 0){
      const timezonesArray = timezones.map(x => x.value)
      builder.Prompts.choice(session, "What is your timezone?", timezonesArray, { listStyle: builder.ListStyle.button })
    } else {
      session.dialogData.timeOffset = userTimezone[0].timeOffset
      next()
    }
  }, 
  (session, results) => {
      if(results.response) {
        const userZoneToSave = new userTimezoneModel() 
        userZoneToSave.userName = session.message.user.name
        userZoneToSave.userId = session.message.user.id
        userZoneToSave.timeOffset = timezones[results.response.index].offset
        session.dialogData.timeOffset = timezones[results.response.index].offset
        userTimezoneService.returnCreateTimezone(userZoneToSave)
      }
      builder.Prompts.time(session, "Please provide a event date and time (e.g.: June 6th 11:30)");
  },
  (session, results) => {
      session.dialogData.eventDate = builder.EntityRecognizer.resolveTime([results.response]);
      builder.Prompts.text(session, "Where is it should be?");
  },
  (session, results) => {
      session.dialogData.eventPlace = results.response.replace(botName, '');
      builder.Prompts.text(session, "Enter event description");
  },
  (session, results) => {
      session.dialogData.eventDescription = results.response.replace(botName, '');
      const convertedDate = strftime('%F %T', new Date(session.dialogData.eventDate))
      const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`
      session.send(`Event confirmed. ${eventInfo}`);
      eventPlaner.start(session)
  }
])

bot.dialog('sendNotification', (session, event) => {
  const eventDate = new Date(event.eventDate)
  eventDate.setHours(eventDate.getHours() + event.userTimeOffset)
  const convertedDate = strftime('%F %T', eventDate)
  const eventInfo = `(*) Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`  
  session.endDialog(eventInfo)
});

