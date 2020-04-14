import React, {useState} from 'react'
import Chip from '@material-ui/core/Chip'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import {useActivity} from 'contexts/ActivityContext'

const toHyphenCase = e => e.replace(/\s+/g, '-').toLowerCase()

const TagField = ({tags, setTags, allowNewValues = false}) => {
  const {usedTags} = useActivity()

  return <Autocomplete
    multiple
    freeSolo={allowNewValues}
    options={usedTags}
    value={tags}
    renderTags={(value, getTagProps) =>
      value.map((option, index) => (
        <Chip variant="outlined" label={toHyphenCase(option)} {...getTagProps({index})} />
      ))
    }
    renderInput={(params) => (
      <TextField {...params} label="Tags" placeholder="Tags" margin="dense" fullWidth/>
    )}
    onChange={(e, v) => {
      setTags(v.map(toHyphenCase))
    }}
  />
}

export default TagField
