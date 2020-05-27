import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import Chip from '@material-ui/core/Chip'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import {Delete, Edit} from '@material-ui/icons'
import {useParams} from 'react-router'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'

export const Detail = ({start: _start, end: _end, name, tags}) => {
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const end = DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const duration = end.diff(start)

  return <>
    <Button data-testid='back-btn'>Back</Button>
    <IconButton data-testid='delete-btn'><Delete/></IconButton>
    <IconButton data-testid='edit-btn'><Edit/></IconButton>
    <Typography data-testid='duration'>{formatDuration(duration)}</Typography>
    <Typography data-testid='name'>{name}</Typography>
    {tags && tags.map(t => <Chip data-testid={`tag-${t}`} key={t} label={t} size='small'/>)}
  </>
}

export default () => {
  const {id} = useParams()
  const {loadActivity, activity} = useActivity()

  useEffect(() => {
    loadActivity(id)
  }, [id])

  return <Detail {...activity}/>
}
