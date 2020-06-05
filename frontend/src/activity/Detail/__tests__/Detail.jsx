import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {Detail} from 'activity/Detail/index'
import {DateTime} from 'luxon'

jest.mock('react-router')

const now = DateTime.utc()

const activity = {
  start: now,
  end: now.plus({hours: 1, minutes: 35}),
  name: 'task #1',
  tags: ['acme','another-tag']
}

describe('Activity Detail Page', () => {
  it('should display the elapsed duration', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('duration')).toHaveTextContent('1h35m')
  })

  it('should display the name of the activity', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('name')).toHaveTextContent('task #1')
  })

  it('should display the tags of the activity', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('tag-acme')).toHaveTextContent('acme')
    expect(getByTestId('tag-another-tag')).toHaveTextContent('another-tag')
  })

  it('should display a back button', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('back-btn')).toBeVisible()
    expect(getByTestId('back-btn')).toHaveTextContent('Back')
  })

  it('should display a edit button', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('edit-btn')).toBeVisible()
  })

  it.skip('should display a delete button', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('delete-btn')).toBeVisible()
  })

  it('should render with empty tags', () => {
    const activity = {
      tags: []
    }

    render(<Detail {...activity}/>)
  })

  it('should render with undefined tags', () => {
    const activity = {
      tags: undefined
    }

    render(<Detail {...activity}/>)
  })

  it('should show elapsed time until now with undefined end time', () => {
    const activity = {
      start: now.minus({hours: 2, minutes: 35})
    }

    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('duration')).toHaveTextContent('2h35m')
  })
})
