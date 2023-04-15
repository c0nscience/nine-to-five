import { Writable, writable } from 'svelte/store'
import { DateTime } from 'luxon'

export class Activity {
  id: string
  userId: string
  name: string
  start: DateTime
  end?: DateTime
  tags: string[]
}

export const activities: Writable<Activity[]> = writable([])
