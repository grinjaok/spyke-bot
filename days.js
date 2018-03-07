const date = new Date()
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday',]
const daysOfTheWeek = [
  {
    "value": "Today",
    "offset": 0,
  },  {
    "value": "Tomorrow",
    "offset": 1,
  },  {
    "value": days[ date.getDay() + 2],
    "offset": 2,
  },
  {
    "value": days[ date.getDay() + 3],
    "offset": 3,
  },
  {
    "value": days[ date.getDay() + 4],
    "offset": 4,
  },
  {
    "value": days[ date.getDay() + 5],
    "offset": 5,
  },
  {
    "value": days[ date.getDay() + 6],
    "offset": 6,
  },
  {
    "value": "Enter the date",
    "offset": 7
  }
]

module.exports = daysOfTheWeek