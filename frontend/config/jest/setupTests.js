const {Settings} = require('luxon')

module.exports = async () => {
  Settings.defaultZoneName = 'Europe/Berlin'
}
