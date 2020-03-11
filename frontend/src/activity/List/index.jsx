import React from 'react'
import WeekCard from './WeekCard'
import {extendedDayjs as dayjs} from 'extendedDayjs'
import {useActivity} from 'contexts/ActivityContext'
import {Duration} from 'luxon'

const weekDateFormat = 'GGGG-W'

const fromWeekDate = s => dayjs(s, weekDateFormat)

const List = () => {
  const {activitiesByWeek: byWeek} = useActivity()

  return <>
    {Object.entries(byWeek)
      .sort((a, b) => fromWeekDate(b[0]).diff(fromWeekDate(a[0])))
      .map(v => {
        const [weekNumber, week] = v

        const totalWeekDurationAsMinutes = Duration.fromISO(week.totalDuration).as('minutes')

        return <WeekCard key={weekNumber}
                         totalDurationInMinutes={totalWeekDurationAsMinutes}
                         weekNumber={weekNumber}
                         days={week.days}/>
      })}
  </>
}

export default List
