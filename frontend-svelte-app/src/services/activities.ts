import { httpCli } from './api'
import { DateTime } from 'luxon'
import { activities, Activity } from '../stores/activities'

const _loadInRange = (from: DateTime, to: DateTime) => {
  return httpCli.get(`activities/${from.toISODate()}/${to.toISODate()}`)
    .then((resp) => resp.data as { entries: Activity[] })
    .then(r => activities.set(r.entries))
}

export default {
  loadInRange: _loadInRange,
}
