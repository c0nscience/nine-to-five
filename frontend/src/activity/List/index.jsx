import React, {useEffect} from 'react'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'
import DayPicker from 'activity/List/DayPicker'
import ActivityItem from 'activity/List/ActivityItem'
import MuiList from '@material-ui/core/List'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  list: {
    marginBottom: theme.mixins.toolbar.minHeight
  }
}))

export const List = ({activities}) => {
  const classes = useStyles()

  return <MuiList className={classes.list}>
    {
      activities
        .sort((a, b) => DateTime.fromISO(a.start).diff(DateTime.fromISO(b.start)).valueOf())
        .filter(activity => activity.end !== undefined)
        .map((activity, index) => {
          let hideEndTime = false
          const next = activities[index + 1]
          if (next) {
            const currentEndTime = DateTime.fromISO(activity.end)
            const nextEndTime = next && DateTime.fromISO(next.start)
            const diff = currentEndTime.diff(nextEndTime).valueOf()
            hideEndTime = diff === 0
          }

          return <ActivityItem {...activity}
                               hideEndTime={hideEndTime}
                               key={`activity-${activity.id}`}/>
        })
    }
  </MuiList>
}

export default () => {
  const {loadActivitiesInRange, activities} = useActivity()

  const now = DateTime.local()
  useEffect(() => {
    loadActivitiesInRange(now, now)
  }, [])

  return <>
    <DayPicker date={now}
               onChanged={d => {
                 loadActivitiesInRange(d, d)
               }}/>

    <List activities={activities}/>
  </>
}
