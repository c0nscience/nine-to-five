import React from 'react'
import WeekCard from './WeekCard'
import {useActivity} from 'contexts/ActivityContext'
import {useStatistics} from 'contexts/StatisticContext'
import {DateTime} from 'luxon'

const List = () => {
  const {activitiesByWeek: byWeek} = useActivity()
  const {overtimes} = useStatistics()

  return <>
    {Object.entries(byWeek)
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map(v => {
        const [weekNumber, week] = v

        return <WeekCard key={weekNumber}
                         totalDuration={week.totalDuration}
                         weekNumber={weekNumber}
                         days={week.days}/>
      })}
  </>
}

export default List
