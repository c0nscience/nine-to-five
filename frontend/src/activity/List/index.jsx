import React from 'react'
import WeekCard from './WeekCard'
import {useActivity} from 'contexts/ActivityContext'
import {useStatistics} from 'contexts/StatisticContext'
import {DateTime} from 'luxon'
import NoEntriesFound from 'activity/List/NoEntriesFound'

const List = () => {
  const {activitiesByWeek: byWeek} = useActivity()
  const {overtimes} = useStatistics()
  const weeks = Object.entries(byWeek)

  return <>
    {(weeks.length > 0) && weeks
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map((v, index) => {
        const [weekNumber, week] = v

        return <WeekCard key={weekNumber}
                         lastElement={index + 1 === weeks.length}
                         totalDuration={week.totalDuration}
                         weekNumber={weekNumber}
                         days={week.days}/>
      })}
    {(weeks.length === 0) && <NoEntriesFound/>}
  </>
}

export default List
