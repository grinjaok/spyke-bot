
const restify = require('restify')
const builder = require('botbuilder')
const timer = require('./timer')
const mongoose = require('mongoose')
const server = restify.createServer()

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

timer.serverAwake()

bot.dialog('/', (session) => {
  if (session.message.text.includes('#EVENTPLANNING')) {
    timer.start(session)
  }
});