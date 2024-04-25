import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'

import {RunningBox} from '../RunningBox'
import {Duration} from "luxon";

jest.mock('react-router')

describe('Running Activity Box', function () {
  const runningActivity = {
    name: 'overtime',
    duration: Duration.fromISO('PT1H45M'),
    tags: ['1', '2'],
    since: '08:00'
  }

  it('should show the activity name', function () {
    const {getByTestId} = render(<RunningBox {...runningActivity}/>)
    expect(getByTestId('name')).toHaveTextContent('overtime')
  })

  it('should show the activity duration', function () {
    const {getByTestId} = render(<RunningBox {...runningActivity}/>)
    expect(getByTestId('duration')).toHaveTextContent('1h 45m')
  })

  it('should show the activity tags', function () {
    const {getByTestId} = render(<RunningBox {...runningActivity}/>)
    expect(getByTestId('tag-1')).toHaveTextContent('1')
    expect(getByTestId('tag-2')).toHaveTextContent('2')
  })

  it('should show the start time', function () {
    const {getByTestId} = render(<RunningBox {...runningActivity}/>)
    expect(getByTestId('since')).toHaveTextContent('08:00')
  })

})
