import React, {useEffect} from 'react'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Fab from '@material-ui/core/Fab'
import {Add} from '@material-ui/icons'
import Typography from '@material-ui/core/Typography'
import MuiList from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import {ListItemText} from '@material-ui/core'
import {useHistory} from 'react-router'
import {useMetrics} from 'contexts/MetricsContext'

const useStyles = makeStyles(theme => ({
  addButton: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}))

const EmptyMessage = () => <Typography data-testid='empty-message'>No metrics configured.</Typography>

export const List = ({metrics = []}) => {
  const classes = useStyles()
  const history = useHistory()

  return <>
    <Fab aria-label="add"
         data-testid='add-button'
         className={classes.addButton}
    onClick={() => history.push('metrics/new')}>
      <Add/>
    </Fab>
    {(metrics.length > 0) && <MuiList disablePadding>
      {metrics.map(m =>
        <ListItem key={m.id}
                  data-testid={`entry-${m.id}`}
                  button
                  onClick={() => history.push(`/metrics/${m.id}`)}>
          <ListItemText primary={m.name}/>
        </ListItem>
      )}
    </MuiList>}

    {(metrics.length === 0) && <EmptyMessage/>}
  </>
}

export default () => {
  const {configurations, loadMetricConfigurations} = useMetrics()

  useEffect(() => {
    loadMetricConfigurations()
  }, [])

  return <List metrics={configurations}/>
}
