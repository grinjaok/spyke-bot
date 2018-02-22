const notification = require('./notification.model')
const toSeconds = 1000;

class Timer {
  start(message) {
    const notification = JSON.parse(message.split('|')[1])
    const splitDate = notification.Date.split('-')
    const splitTime = notification.Time.split('-')
    const timeWhenInvoke = +new Date(splitDate[2], splitDate[0], splitDate[1], splitTime[0], splitTime[1])
    const timeToInvoke = (timeWhenInvoke - Date.now()) / toSeconds
    return {time: timeToInvoke, description: notification.description}
    // const task = setTimeout(() => {
    //   session.send(notification.description)
    // }, timeToInvoke);
  }
}

module.exports = new Timer()