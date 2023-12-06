import { DateTime } from 'luxon'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'

export interface Activity {
  id: string
  userId: string
  name: string
  start: DateTime
  end?: DateTime
  tags: string[]
}

export const activities: Writable<Activity[]> = writable([])

export const running: Writable<Activity> = writable()
