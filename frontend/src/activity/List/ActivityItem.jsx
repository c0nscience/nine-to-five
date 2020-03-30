import React, {forwardRef, useState} from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {DateTime} from 'luxon'
import IconButton from '@material-ui/core/IconButton'
import {Edit, MoreVert as More, Replay, Shuffle} from '@material-ui/icons'
import Menu from '@material-ui/core/Menu'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import MenuItem from '@material-ui/core/MenuItem'
import {useActivity} from 'contexts/ActivityContext'
import {CardHeader} from '@material-ui/core'
import Avatar from '@material-ui/core/Avatar'
import {useBulkMode} from 'contexts/BulkModeContext'
import Checkbox from '@material-ui/core/Checkbox'

const useStyles = makeStyles(theme => {
  const avatarBackgroundColor = theme.palette.primary
  return {
    itemText: {
      margin: 0
    },
    durationAvatar: {
      backgroundColor: avatarBackgroundColor.main,
      textColor: avatarBackgroundColor.contrastText
    }
  }
})

const ActivityItem = forwardRef(({id, name, start: _start, end: _end}, ref) => {
  const classes = useStyles()
  const [anchorEl, setAnchorEl] = useState(undefined)
  const {running, selectActivity, switchActivity, continueActivity} = useActivity()
  const {bulkSelectModeEnabled, switchBulkSelectMode, addToBulkSelection, removeFromBulkSelection} = useBulkMode()
  const isActivityRunning = typeof running !== 'undefined'

  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const isInTheFuture = DateTime.local() < start
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start)

  let avatar
  if (bulkSelectModeEnabled) {
    avatar = <Checkbox onChange={e => {
      const checked = e.target.checked
      if (checked) {
        addToBulkSelection(id)
      } else {
        removeFromBulkSelection(id)
      }
    }}/>
  } else {
    avatar = <Avatar aria-label="worked duration" className={classes.durationAvatar} onClick={() => switchBulkSelectMode()}>
      {duration.as('hours').toPrecision(1)}
    </Avatar>
  }

  return <ListItem ref={ref} disableGutters disabled={isInTheFuture}>
    <ListItemText className={classes.itemText}>
      <Card>
        <CardHeader title={name}
                    avatar={avatar}
                    action={<IconButton aria-label="Menu"
                                        aria-haspopup="true"
                                        onClick={(event) => {
                                          setAnchorEl(event.currentTarget)
                                        }}>
                      <More/>
                    </IconButton>}/>
      </Card>
      <Menu
        id={`item-menu-${id}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(undefined)}>
        {!isActivityRunning && <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          continueActivity(name)
        }}>
          <ListItemIcon>
            <Replay/>
          </ListItemIcon>
          <ListItemText primary='Replay'/>
        </MenuItem>}
        {isActivityRunning && <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          switchActivity(name)
        }}>
          <ListItemIcon>
            <Shuffle/>
          </ListItemIcon>
          <ListItemText primary='Switch'/>
        </MenuItem>}
        <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          selectActivity({
            id,
            name,
            start: start.toISO(),
            end: end.toISO()
          })
        }}>
          <ListItemIcon>
            <Edit/>
          </ListItemIcon>
          <ListItemText primary='Edit'/>
        </MenuItem>
      </Menu>
    </ListItemText>
  </ListItem>
})
export default ActivityItem
