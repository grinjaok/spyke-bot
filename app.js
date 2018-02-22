
const restify = require('restify')
const builder = require('botbuilder')
const timer = require('./timer')
const server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
 console.log('%s listening to %s', server.name, server.url)
});

const connector = new builder.ChatConnector({
 appId: process.env.MICROSOFT_APP_ID,
 appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector)

server.post('/api/messages', connector.listen())

bot.dialog('/', (session) => {
if (session.message.text.includes('#EVENTPLANE')) {
  const info = timer.start(session.message.text)
  setTimeout(() => {
    session.send(info.description)
  }, info.time)
}

});