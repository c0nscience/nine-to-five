import React from 'react'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Fab from '@material-ui/core/Fab'
import {Add} from '@material-ui/icons'

const useStyles = makeStyles(theme => ({
  addButton: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}))

const List = ({metrics}) => {
  const classes = useStyles()

  return <>
    <Fab aria-label="add" data-testid='add-button'>
      <Add />
    </Fab>
    <ul>
      {metrics.map(m => <li data-testid={`entry-${m.id}`} key={m.id}><a data-testid={`link-${m.id}`}
                                                                        href={`/metrics/${m.id}`}>{m.name}</a></li>)}
    </ul>
  </>
}

export default List
