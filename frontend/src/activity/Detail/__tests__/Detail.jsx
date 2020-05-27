import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {Detail} from 'activity/Detail/index'
import {DateTime} from 'luxon'

const activity = {
  start: DateTime.fromISO('2020-05-27T08:00:00.000Z'),
  end: DateTime.fromISO('2020-05-27T09:35:00.000Z'),
  name: 'task #1',
  tags: ['acme','another-tag']
}

describe('Activity Detail Page', () => {
  it('should display the elapsed duration', () => {
    const {getByTestId} = render(<Detail {...activity}/>)

    expect(getByTestId('duration')).toHaveTextContent('1h 35m')
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

  it('should display a delete button', () => {
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
})
