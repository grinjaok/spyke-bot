'use strict'
const restify = require('restify')
const builder = require('botbuilder')
const eventPlaner = require('./eventPlaner')
const mongoose = require('mongoose')
const strftime = require('strftime')
const userTimezoneService = require('./userTimezoneService')
const userTimezoneModel = require('./userTimezone.model')
const timezones = require('./timezone')
const daysOfTheWeek = require('./days')
const botName = 'event-planner-skype-bot'
const twoMinutes = 2 * 60 * 1000
const customDate = 7
const customTime = 4
const today = 0

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
    const userTimezone = await userTimezoneService.returnFindTimezone({ userId: session.message.user.id })
    if (userTimezone.length === 0) {
      const timezonesArray = timezones.map(x => x.value)
      builder.Prompts.choice(session, "What is your timezone?", timezonesArray, { listStyle: builder.ListStyle.button })
    } else {
      session.dialogData.timeOffset = userTimezone[0].timeOffset
      next()
    }
  },
  (session, results) => {
    if (results.response) {
      const userZoneToSave = new userTimezoneModel()
      userZoneToSave.userName = session.message.user.name
      userZoneToSave.userId = session.message.user.id
      userZoneToSave.timeOffset = timezones[results.response.index].offset
      session.dialogData.timeOffset = timezones[results.response.index].offset
      userTimezoneService.returnCreateTimezone(userZoneToSave)
    }
    const daysArray = daysOfTheWeek.map(x => x.value)
    builder.Prompts.choice(session, "Please, select the date", daysArray, { listStyle: builder.ListStyle.button })
  },
  (session, results) => {
    if (results.response.index !== customDate) {
      session.dialogData.eventDayOffset = daysOfTheWeek[results.response.index].offset;
      if (results.response.index === today) {
        const timeArray = eventPlaner.getCloseTime(session).map(x => strftime('%H:%M', x))
        timeArray.push('Enter the time')
        builder.Prompts.choice(session, "Please, select the time", timeArray, { listStyle: builder.ListStyle.button })
      } else {
        builder.Prompts.text(session, "Please provide a event time (e.g. 11:30)");
      }
    } else {
      session.dialogData.customDate = true
      builder.Prompts.time(session, "Please provide a event date and time (e.g.: June 6th 11:30)");
    }
  },
  (session, results, next) => {
    if (!session.dialogData.customDate) {
      if (results.response.entity) {
        if (results.response.index !== customTime) {
          session.dialogData.eventTime = results.response.entity.replace(botName, '')
          session.dialogData.eventDate = eventPlaner.convertSelectedDateToEventDate(session)
        }
        else {
          session.dialogData.isCustomTime = true
        }
      } else {
        session.dialogData.eventTime = results.response.replace(botName, '')
        session.dialogData.eventDate = eventPlaner.convertSelectedDateToEventDate(session)
      }
    } else {
      session.dialogData.eventDate = builder.EntityRecognizer.resolveTime([results.response]);
    }

    if (session.dialogData.isCustomTime) {
      builder.Prompts.text(session, "Please provide a event time (e.g. 11:30)");
    } else {
      builder.Prompts.text(session, "Where is it should be?");
    }

  },
  (session, results) => {
    if (session.dialogData.isCustomTime) {
      session.dialogData.eventTime = results.response.replace(botName, '');
      session.dialogData.eventDate = eventPlaner.convertSelectedDateToEventDate(session)
      builder.Prompts.text(session, "Where is it should be?");
    } else {
      session.dialogData.eventPlace = results.response.replace(botName, '');
      builder.Prompts.text(session, "Enter event description");
    }
  },
  (session, results) => {
    if (session.dialogData.isCustomTime) {
      session.dialogData.eventPlace = results.response.replace(botName, '');
      builder.Prompts.text(session, "Enter event description");
    } else {
      session.dialogData.eventDescription = results.response.replace(botName, '');
      const convertedDate = strftime('%F %T', new Date(session.dialogData.eventDate))
      const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`
      eventPlaner.start(session)
      session.endDialog(`Event confirmed. ${eventInfo}`)
    }
  },
  (session, results) => {
    session.dialogData.eventDescription = results.response.replace(botName, '');
    const convertedDate = strftime('%F %T', new Date(session.dialogData.eventDate))
    const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`
    eventPlaner.start(session)
    session.endDialog(`Event confirmed. ${eventInfo}`)
  }
])
.endConversationAction(
  "endEvent", 'Event planning was canceled <br/>Progress was abandoned',
  {
      matches: /^#cancel-event$/i,
      confirmPrompt: 'This will cancel your event creation. Are you sure?'
  }
);

bot.dialog('recurrentEvent', (session) => {
  session.endDialog('hello to recurrent event')
}).triggerAction({
  matches: /^#recurrent-event$/i
});

bot.dialog('sendNotification', (session, event) => {
  const eventDate = new Date(event.eventDate)
  eventDate.setHours(eventDate.getHours() + event.userTimeOffset)
  const convertedDate = strftime('%F %T', eventDate)
  const eventInfo = `(*) Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`
  session.endDialog(eventInfo)
});

