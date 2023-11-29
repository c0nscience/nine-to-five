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

const _loadInRange = async (from: DateTime, to: DateTime) => {
  const resp = await httpCli.get(`activities/${from.toISODate()}/${to.toISODate()}`)
  const respData = resp.data as { entries: ActivityDto[] }
  const entries = respData.entries
  const mappedActivities = entries.map(a => {
    return {
      id: a.id,
      name: a.name,
      userId: a.userId,
      tags: a.tags,
      start: DateTime.fromISO(a.start).toLocal(),
      end: a.end && DateTime.fromISO(a.end).toLocal()
    } as Activity
  })
  return activities.set(mappedActivities)
}

export default {
  loadInRange: _loadInRange,
}
