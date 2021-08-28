import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {ActivityItem} from 'activity/List/ActivityItem'
import {DateTime} from 'luxon'

jest.mock('react-router')

describe('Activity Item', () => {
  it('should display the start time', () => {
    const activity = {
      name: 'task 1',
      start: DateTime.utc(2020, 5, 25, 6, 0).toISO()
    }
    const {getByTestId} = render(<ActivityItem {...activity}/>)

    expect(getByTestId('start-time')).toHaveTextContent('08:00')
  })

  it('should hide the start time', () => {
    const activity = {
      name: 'task 1',
      start: DateTime.utc(2020, 5, 25, 6, 0).toISO()
    }
    const {queryByTestId} = render(<ActivityItem {...activity} hideStartTime/>)

    expect(queryByTestId('start-time')).toBeNull()
  })

  it('should display the end time', () => {
    const activity = {
      name: 'task 1',
      start: DateTime.utc(2020, 5, 25, 6, 0).toISO(),
      end: DateTime.utc(2020, 5, 25, 8, 0).toISO()
    }
    const {getByTestId} = render(<ActivityItem {...activity}/>)

    expect(getByTestId('end-time')).toHaveTextContent('10:00')
  })

  it('should hide the end time', () => {
    const activity = {
      name: 'task 1',
      start: DateTime.utc(2020, 5, 25, 6, 0).toISO(),
      end: DateTime.utc(2020, 5, 25, 8, 0).toISO()
    }
    const {queryByTestId} = render(<ActivityItem {...activity} hideEndTime/>)

    expect(queryByTestId('end-time')).toBeNull()
  })
})
