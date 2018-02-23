
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

setInterval(eventPlaner.comingEvents, twoMinutes)

bot.dialog('/', (session) => {
  if (session.message.text.includes('#EVENTPLANNING')) {
    eventPlaner.start(session)
  }
});