import utc from 'dayjs/plugin/utc'
import isoWeek from 'dayjs/plugin/isoWeek'
import dayjs from 'dayjs'

export const extendedDayjs =
  dayjs
    .extend(utc)
    .extend(isoWeek)

export const formatMinutesAsHours = totalDurationInMinutes => {
  const hours = Math.floor(totalDurationInMinutes / 60)
  const minutes = totalDurationInMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
