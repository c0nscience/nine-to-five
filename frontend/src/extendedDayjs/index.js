import utc from 'dayjs/plugin/utc'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import weekYear from 'dayjs/plugin/weekYear'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import dayjs from 'dayjs'

export const extendedDayjs =
  dayjs
    .extend(utc)
    .extend(isoWeek)
    .extend(customParseFormat)
    .extend(advancedFormat)
    .extend(weekYear)
    .extend(weekOfYear)

export const formatMinutesAsHours = totalDurationInMinutes => {
  const hours = Math.floor(totalDurationInMinutes / 60)
  const minutes = totalDurationInMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
