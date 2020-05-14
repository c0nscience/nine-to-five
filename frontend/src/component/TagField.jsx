import React from 'react'
import Chip from '@material-ui/core/Chip'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import {useActivity} from 'contexts/ActivityContext'

const toHyphenCase = e => e.replace(/\s+/g, '-').toLowerCase()

export const TagField = ({tags, setTags, allowNewValues = false, usedTags = [], ...props}) =>
  <Autocomplete
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
      <TextField {...params} label="Tags" placeholder="Tags" margin="dense" fullWidth variant='filled'/>
    )}
    onChange={(e, v) => {
      setTags(v.map(toHyphenCase))
    }}
    {...props}
  />


export default props => {
  const {usedTags} = useActivity()
  return <TagField {...props} usedTags={usedTags}/>
}