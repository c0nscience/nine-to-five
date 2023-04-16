import { DateTime } from 'luxon'
import type { Activity } from '../stores/activities'
import { activities } from '../stores/activities'
import { httpCli } from './api'

interface ActivityDto {
  id: string
  userId: string
  name: string
  start: string
  end?: string
  tags: string[]
}

const _loadInRange = (from: DateTime, to: DateTime) => {
  return httpCli.get(`activities/${from.toISODate()}/${to.toISODate()}`)
    .then((resp) => resp.data as { entries: ActivityDto[] })
    .then(r => r.entries)
    .then(e => e.map(a => {
      return {
        id: a.id,
        name: a.name,
        userId: a.userId,
        tags: a.tags,
        start: DateTime.fromISO(a.start).toLocal(),
        end: a.end && DateTime.fromISO(a.end).toLocal()
      } as Activity
    }))
    .then(r => activities.set(r))
}

export default {
  loadInRange: _loadInRange,
}
