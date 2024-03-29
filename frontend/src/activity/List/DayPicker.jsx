import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import {DateTime} from 'luxon'
import IconButton from '@material-ui/core/IconButton'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import {ArrowBackIos, ArrowForwardIos} from '@material-ui/icons'
import Grid from '@material-ui/core/Grid'
import {makeStyles} from '@material-ui/core/styles'
import {Popover} from "@material-ui/core";
import LuxonUtils from "@date-io/luxon";
import {DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers";
import {useAuth0} from '@auth0/auth0-react'

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
  const {logout} = useAuth0()
  const [currentDate, setCurrentDate] = useState(DateTime.local())
  const [anchorEl, setAnchorEl] = useState(null)

  const isToday = currentDate.toISODate() === DateTime.local().toISODate()

  useEffect(() => {
    if (typeof date !== 'undefined') {
      setCurrentDate(date)
      onChanged(date)
    }
  }, [])

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return <Grid container className={classes.root}>
    <Grid item xs={3} style={{textAlign: 'end'}}>
      <IconButton data-testid='previous'
                  onClick={() => {
                    setCurrentDate(d => {
                      let newDate = d.minus({days: 1})
                      onChanged(newDate)
                      return newDate
                    })
                  }}>
        <ArrowBackIos/>
      </IconButton>
    </Grid>
    <Grid item xs={5}>
      <Typography data-testid='label'
                  variant='h6'
                  className={classes.label}
                  onClick={handlePopoverOpen}
                  align='center'>{
        isToday
          ? 'Today'
          : currentDate.toFormat('EEE, DD')
      }</Typography>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div data-testid='date-picker'>
          <MuiPickersUtilsProvider utils={LuxonUtils}>
            <DatePicker
              autoOk
              variant="static"
              openTo="date"
              value={currentDate}
              onChange={d => {
                onChanged(d)
                setCurrentDate(d)
                handlePopoverClose()
              }}
            />
          </MuiPickersUtilsProvider>
        </div>
      </Popover>
    </Grid>
    <Grid item xs={2} style={{textAlign: 'start'}}>
      <IconButton data-testid='next'
                  onClick={() => {
                    setCurrentDate(d => {
                      let newDate = d.plus({days: 1})
                      onChanged(newDate)
                      return newDate
                    })
                  }}>
        <ArrowForwardIos/>
      </IconButton>
    </Grid>
    <Grid item xs={2} style={{textAlign: 'start'}}>
      <IconButton data-testid='logout'
                  onClick={() => {
                    logout()
                  }}>
        <ExitToAppIcon/>
      </IconButton>
    </Grid>
  </Grid>
}
