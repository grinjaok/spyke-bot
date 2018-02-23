
const restify = require('restify')
const builder = require('botbuilder')
const eventPlaner = require('./eventPlaner')
const mongoose = require('mongoose')
const util = require('util')

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

server.post('/api/messages', connector.listen())

setInterval(eventPlaner.comingEvents, 5000)


bot.dialog('eventPlanning', [
  function (session) {
      session.send("Welcome to event planning");
      builder.Prompts.time(session, "Please provide a event date and time (e.g.: June 6th at 5pm)");
  },
  function (session, results) {
      session.dialogData.eventDate = builder.EntityRecognizer.resolveTime([results.response]);
      builder.Prompts.text(session, "Where is it should be?");
  },
  function (session, results) {
      session.dialogData.eventPlace = results.response;
      builder.Prompts.text(session, "Enter event description");
  },
  function (session, results) {
      session.dialogData.eventDescription = results.response;
      session.send(`Event confirmed. Event details: <br/>Date/Time: ${session.dialogData.eventDate} <br/>Place: ${session.dialogData.eventPlace} <br/>Description: ${session.dialogData.eventDescription}`);
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
  // session.send(`Event details: <br/>Date/Time: ${event.eventDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`)
  session.endDialog(`Event details: <br/>Date/Time: ${event.eventDate} <br/>Place: ${event.eventPlace} <br/>Description: ${event.eventDescription}`)
});

