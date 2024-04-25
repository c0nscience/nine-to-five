import React from 'react'
import Chip from '@material-ui/core/Chip'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import {toHyphenCase} from 'functions'

export const TagField = ({tags = [], setTags, allowNewValues = false, usedTags = [], ...props}) => {
  return <Autocomplete
    multiple
    freeSolo={allowNewValues}
    options={usedTags}
    value={tags}
    renderTags={(value, getTagProps) =>
      value.map((opt, index) => {
        const option = toHyphenCase(opt)
        return (
          <Chip data-testid={`value-${option}`} variant="outlined" label={option} {...getTagProps({index})} />
        )
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="Tags" placeholder="Tags" margin="dense" name='tags' fullWidth variant='filled'/>
    )}
    onChange={(e, v) => {
      setTags(v.map(toHyphenCase))
    }}
    {...props}
  />
}
