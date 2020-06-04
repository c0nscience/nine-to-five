import React from 'react'
import {ActivityItemCard} from "./ActivityItem";
import {DateTime} from "luxon";

export const RunningBox = ({name, tags, duration}) =>
  <ActivityItemCard name={name} tags={tags} duration={duration}/>

export default ({activity}) => {
  const start = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
  const duration = DateTime.local().diff(start)

  return <RunningBox name={activity.name} tags={activity.tags} duration={duration}/>
}
