
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

const eventEmitter = eventPlaner.getEventEmitter()

server.post('/api/messages', connector.listen())

setInterval(eventPlaner.comingEvents, 5000)

bot.dialog('/', (session, event) => {
  if (session.message.text.includes('#EVENTPLANNING')) {
    eventPlaner.start(session)
  }

  if (event) {
    session.send(`Event planned on ${event.Time} ${event.Description}`)
  }
});

eventEmitter.on('sendNotification', (event) => {
  const address = JSON.parse(event.Address)
  bot.beginDialog(address, '/', event)
})

// bot.dialog('/sendNotification', (session, event) => {
//   session.send(`Event planned on ${event.Time} ${event.Description}` )
// })
