import { Writable, writable } from 'svelte/store'
import { DateTime } from 'luxon'


export const currentDate: Writable<DateTime> = writable(DateTime.local())
