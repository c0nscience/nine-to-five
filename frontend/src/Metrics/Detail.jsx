import React from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'

const Detail = ({metric}) => {
  const {name, total, current} = metric
  return <>
    <Typography data-testid='heading'>{name}</Typography>

    <Typography data-testid='total-heading'>Total Overtime</Typography>
    <Typography data-testid='total-value'>{formatDuration(total)}</Typography>

    <Typography data-testid='current-heading'>Current Overtime</Typography>
    <Typography data-testid='current-value'>{formatDuration(current)}</Typography>
  </>
}

export default Detail
