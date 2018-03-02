'use strict'
const restify = require('restify')
const builder = require('botbuilder')
const eventPlaner = require('./eventPlaner')
const mongoose = require('mongoose')
const strftime = require('strftime')
const sixtyMinutes = 60
require('dotenv').config()

const twoMinutes = 2 * 60 * 1000

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

bot.dialog('eventPlanning', [  
  (session) => {
      session.send("Welcome to event planning");
      builder.Prompts.time(session, "Please provide a event date and time (e.g.: June 6th 11:30)");
  },
  (session, results) => {
      session.dialogData.eventDate = builder.EntityRecognizer.resolveTime([results.response]);
      builder.Prompts.text(session, "Where is it should be?");
  },
  (session, results) => {
      session.dialogData.eventPlace = results.response;
      builder.Prompts.text(session, "Enter event description");
  },
  (session, results) => {
      session.dialogData.eventDescription = results.response;
      const convertedDate = strftime('%F %T', new Date(session.dialogData.eventDate))
      const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`
      session.send(`Event confirmed. ${eventInfo}`);
      eventPlaner.start(session)
      session.endDialog();
  }
])
.triggerAction({
  matches: /^#EP/i,
});

eventPlaner.on('sendNotification', (event) => {
  const address = JSON.parse(event.address)
  bot.beginDialog(address, 'sendNotification', event)
})

bot.dialog('/', (session) => {  
})

bot.dialog('sendNotification', (session, event) => {
  const eventDate = new Date(event.eventDate)
  eventDate.setHours(eventDate.getHours() + event.userTimeOffset / sixtyMinutes)
  const convertedDate = strftime('%F %T', eventDate)
  const eventInfo = `(*) Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`  
  session.endDialog(eventInfo)
});

