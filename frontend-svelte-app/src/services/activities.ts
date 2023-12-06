import { DateTime } from 'luxon'
import type { Activity } from '../stores/activities'
import { activities, running } from '../stores/activities'
import { httpCli } from './api'

interface ActivityDto {
    id: string
    userId: string
    name: string
    start: string
    end?: string
    tags: string[]
}

const loadInRange = async (from: DateTime, to: DateTime) => {
    const resp = await httpCli.get(`activities/${from.toISODate()}/${to.toISODate()}`)
    const respData = resp.data as { entries: ActivityDto[] }
    const entries = respData.entries
    const mappedActivities = entries.map(toActivity)
    return activities.set(mappedActivities)
}

const start = async (activity: ActivityDto) => {
    const resp = await httpCli.post('activity', activity)
    const data = resp.data as ActivityDto
    running.set(toActivity(data))
    return
}

const toActivity = (dto: ActivityDto): Activity => {
    return {
        id: dto.id,
        name: dto.name,
        userId: dto.userId,
        tags: dto.tags,
        start: DateTime.fromISO(dto.start).toLocal(),
        end: dto.end && DateTime.fromISO(dto.end).toLocal()
    } as Activity
}

export default {
    loadInRange,
    start,
}
