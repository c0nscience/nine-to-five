import React from 'react'
import WeekCard from './WeekCard'
import {useActivity} from 'contexts/ActivityContext'
import {useStatistics} from 'contexts/StatisticContext'
import {DateTime} from 'luxon'
import NoEntriesFound from 'activity/List/NoEntriesFound'
import {useNetworkActivity} from 'contexts/NetworkContext'
import CircularProgress from '@material-ui/core/CircularProgress'
import Grid from '@material-ui/core/Grid'

const LoadingNewEntriesIndicator = ({loadingNewEntries}) => {
  //TODO well that does not look good as of now
  return <Grid container>
    <Grid item xs={5}/>
    <Grid item xs={2}>
      {loadingNewEntries && <CircularProgress/>}
      {!loadingNewEntries && <>&nbsp;</>}
    </Grid>
    <Grid item xs={5}/>
  </Grid>
}

const List = () => {
  const {activitiesByWeek: byWeek} = useActivity()
  const {overtimes} = useStatistics()
  const {runningRequests} = useNetworkActivity()
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
    {<LoadingNewEntriesIndicator loadingNewEntries={runningRequests.includes('LOAD_ACTIVITIES_IN_RANGE')}/>}
    {(weeks.length === 0) && <NoEntriesFound/>}
  </>
}

export default List
