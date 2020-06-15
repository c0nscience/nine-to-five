import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import {DateTime} from 'luxon'
import IconButton from '@material-ui/core/IconButton'
import {ArrowBackIos, ArrowForwardIos} from '@material-ui/icons'
import Grid from '@material-ui/core/Grid'
import {makeStyles} from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2)
  },
  label: {
    marginTop: theme.spacing(1)
  }
}))

const noOp = () => {
}

export default ({date, onChanged = noOp}) => {
  const classes = useStyles()
  const [currentDate, setCurrentDate] = useState(DateTime.local())

  const isToday = currentDate.toISODate() === DateTime.local().toISODate()

  useEffect(() => {
    if (typeof date !== 'undefined') {
      setCurrentDate(date)
    }
  }, [])

  return <Grid container className={classes.root}>
    <Grid item xs={4} style={{textAlign: 'end'}}>
      <IconButton data-testid='previous'
                  onClick={() => {
                    setCurrentDate(d => {
                      let newDate = d.minus({days: 1})
                      if (newDate.weekday === 7) {
                        newDate = d.minus({days: 3})
                      } else if (newDate.weekday === 6) {
                        newDate = d.minus({days: 2})
                      }

                      onChanged(newDate)
                      return newDate
                    })
                  }}>
        <ArrowBackIos/>
      </IconButton>
    </Grid>
    <Grid item xs={4}>
      <Typography data-testid='label'
                  variant='h6'
                  className={classes.label}
                  align='center'>{
                    isToday
                      ? 'Today'
                      : currentDate.toFormat('DD')
                  }</Typography>
    </Grid>
    <Grid item xs={4} style={{textAlign: 'start'}}>
      <IconButton data-testid='next'
                  onClick={() => {
                    setCurrentDate(d => {
                      let newDate = d.plus({days: 1})

                      if (newDate.weekday === 6) {
                        newDate = d.plus({days: 3})
                      } else if (newDate.weekday === 7) {
                        newDate = d.plus({days: 2})
                      }

                      onChanged(newDate)
                      return newDate
                    })
                  }}>
        <ArrowForwardIos/>
      </IconButton>
    </Grid>
  </Grid>
}
