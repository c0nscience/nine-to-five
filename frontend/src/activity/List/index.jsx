import React from 'react'
import WeekCard from './WeekCard'
import {extendedDayjs as dayjs} from 'extendedDayjs'

const List = () => {
  const minutes = dayjs.utc('2020-03-11T17:25:00Z').diff(dayjs.utc('2020-03-10T16:20:00Z'), 'minute')
  return <>
    <WeekCard
      totalDurationInMinutes={minutes}
      weekNumber={11}/>
  </>
}

export default List
