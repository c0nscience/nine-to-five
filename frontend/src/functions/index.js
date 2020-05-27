import React from 'react'
import {Duration} from 'luxon'

export const positiveDurationFrom = isoDurationString => {
  const duration = Duration.fromISO(isoDurationString)
  if (duration.valueOf() > 0) {
    return duration
  } else {
    return ZERO_DURATION()
  }
}

export const ZERO_DURATION = () => Duration.fromMillis(0)

export const formatDuration = (duration, opts = {multiline: false}) => {
  if (!duration) {
    return ''
  }

  if (typeof duration === 'string') {
    duration = Duration.fromISO(duration)
  }

  if (opts.multiline) {
    const hours = Math.floor(duration.as('hours'))
    if (hours > 0) {
      return <>{duration.toFormat('h\'h\'')}<br/>{duration.minus({hours}).toFormat('m\'m\'')}</>
    } else {
      return duration.toFormat('m\'m\'')
    }
  } else {
    return duration.toFormat('h\'h\' m\'m\'')
  }

}

export const callValueWith = f => event => {
  const target = event.target
  if (target.value) {
    f(target.value)
  } else {
    f(target.checked)
  }
}

export const toHyphenCase = e => e.replace(/\s+/g, '-').toLowerCase()
