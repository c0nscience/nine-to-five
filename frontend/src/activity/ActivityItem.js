import React from 'react'

const ActivityItem = (props) => {
  const { name, isRunning } = props
  return (
    <li className={isRunning ? 'running' : ''}>{name}</li>
  )
}

export default ActivityItem
