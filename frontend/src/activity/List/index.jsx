import React from 'react'
import WeekCard from './WeekCard'
import {useActivity} from 'contexts/ActivityContext'
import {useStatistics} from 'contexts/StatisticContext'
import {DateTime} from 'luxon'
import NoEntriesFound from 'activity/List/NoEntriesFound'
import CircularProgress from '@material-ui/core/CircularProgress'
import Grid from '@material-ui/core/Grid'
import {useInfiniteScrolling} from 'contexts/IntiniteScrolling'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme =>({
  loadingIndicatorContainer: {
    minHeight: '50px',
    textAlign: 'center',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(3)
  }
}))

const LoadingNewEntriesIndicator = ({loadingNewEntries}) => {
  const classes = useStyles()
  return <Grid container>
    <Grid item xs={5}/>
    <Grid item xs={2} className={classes.loadingIndicatorContainer}>
      {loadingNewEntries && <CircularProgress/>}
    </Grid>
    <Grid item xs={5}/>
  </Grid>
}

const List = () => {
  const {activitiesByWeek: byWeek, hasMore} = useActivity()
  const {overtimes} = useStatistics()
  const {loadingNewEntries, registerLoadingObserver} = useInfiniteScrolling()
  const weeks = Object.entries(byWeek)

  return <>
    {(weeks.length > 0) && weeks
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map((v, index) => {
        const [weekNumber, week] = v

        return <WeekCard key={weekNumber}
                         lastElement={index + 1 === weeks.length}
                         // totalDuration={week.totalDuration}
                         weekNumber={weekNumber}
                         days={week.days}/>
      })}
    <LoadingNewEntriesIndicator loadingNewEntries={loadingNewEntries && hasMore}/>
    {(weeks.length === 0) && <NoEntriesFound ref={registerLoadingObserver}/>}
  </>
}

export default List
