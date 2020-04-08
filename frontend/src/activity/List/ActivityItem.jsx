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
import {useBulkMode} from 'contexts/BulkModeContext'
import Checkbox from '@material-ui/core/Checkbox'
import Chip from '@material-ui/core/Chip'
import {formatDuration} from 'functions'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => {
  const avatarBackgroundColor = theme.palette.primary
  return {
    itemText: {
      margin: 0
    },
    tagContainer: {
      display: 'flex',
      justifyContent: 'start',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5)
      },
      '& > *:first-child': {
        marginLeft: 0
      }
    }
  }
})

const ActivityItem = forwardRef(({id, name, start: _start, end: _end, tags}, ref) => {
  const classes = useStyles()
  const [anchorEl, setAnchorEl] = useState(undefined)
  const [selected, setSelected] = useState(false)
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
    avatar = <Checkbox checked={selected}
                       onChange={e => {
                         const checked = e.target.checked
                         setSelected(checked)
                         if (checked) {
                           addToBulkSelection(id)
                         } else {
                           removeFromBulkSelection(id)
                         }
                       }}/>
  } else {
    if (selected) {
      setSelected(false)
    }
    avatar = <Typography variant='h6'
                         aria-label="worked duration"
                         onClick={() => {
                           addToBulkSelection(id)
                           setSelected(true)
                           switchBulkSelectMode()
                         }}>
      {formatDuration(duration)}
    </Typography>
  }

  return <ListItem ref={ref} disableGutters disabled={isInTheFuture}>
    <ListItemText className={classes.itemText}>
      <Card>
        <CardHeader title={name}
                    subheader={<div className={classes.tagContainer}>
                      {tags.map(t => <Chip key={t} label={t} size='small'/>)}
                    </div>}
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
            end: end.toISO(),
            tags
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
