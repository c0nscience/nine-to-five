import { DateTime } from 'luxon'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'


export const currentDate: Writable<DateTime> = writable(DateTime.local())
