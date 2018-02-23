
const restify = require('restify')
const builder = require('botbuilder')
const eventPlaner = require('./eventPlaner')
const mongoose = require('mongoose')
const util = require('util')
const strftime = require('strftime')
const strftimeUTC3 = strftime.timezone(120)

const server = restify.createServer()
const twoMinutes = 2 * 60 * 1000

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/skype-bot')

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log('%s listening to %s', server.name, server.url)
});

const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector)

// const eventInfo = (date, place, description) => {
//   const convertedDate = strftimeUTC3('%F %T', new Date(date))
//   return `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${place} <br/>Description: ${description}`
// }

server.post('/api/messages', connector.listen())

setInterval(eventPlaner.comingEvents, 5000)


bot.dialog('eventPlanning', [  
  (session) => {
      session.send("Welcome to event planning");
      builder.Prompts.time(session, "Please provide a event date and time (e.g.: June 6th at 5pm)");
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
      const convertedDate = strftimeUTC3('%F %T', new Date(session.dialogData.eventDate))
      const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`
      session.send(`Event confirmed. ${eventInfo}`);
      eventPlaner.start(session)
      session.endDialog();
  }
])
.triggerAction({
  matches: /^#EVENTPLANNING$/i,
});

eventPlaner.on('sendNotification', (event) => {
  const address = JSON.parse(event.address)
  bot.beginDialog(address, 'sendNotification', event)
})

bot.dialog('sendNotification', (session, event) => {
  const convertedDate = strftimeUTC3('%F %T', new Date(event.eventDate))
  const eventInfo = `Event details: <br/>Date/Time: ${convertedDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`  
  session.endDialog(eventInfo)
});



