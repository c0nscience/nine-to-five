import React from 'react'
import Typography from '@material-ui/core/Typography'

const NoEntriesFound = React.forwardRef((props, ref) => <Typography ref={ref} variant='h1'>No Entries found</Typography>)

export default NoEntriesFound
