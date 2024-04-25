import React from 'react'
import Box from '@material-ui/core/Box'
import Skeleton from '@material-ui/lab/Skeleton'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
}))

const SkeletonActivityItem = () => {
  const classes = useStyles()
  return <Box className={classes.root}>
    <Skeleton variant='text' animation='pulse' width='15%'/>
    <Skeleton variant='rect' animation='pulse' height={55}/>
    <Skeleton variant='text' animation='pulse' width='15%'/>
  </Box>

}

export default SkeletonActivityItem
