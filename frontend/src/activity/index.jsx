import React from 'react'
import List from './List'
import RunningActivity from 'activity/RunningActivity'

export default () => {
  return <>
    {/*TODO fix error message component*/}
    {/*<ErrorMessage/>*/}

    {/*<CreateForm/>*/}
    <RunningActivity name={'This is a running activity and it is very very very long ... the fox jumps over the fence'}
                     start={'2020-03-10T22:00:00Z'}/>
    <List/>
  </>
}
