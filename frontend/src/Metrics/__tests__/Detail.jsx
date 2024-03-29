import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {Detail} from '../Detail'

describe('Metric Detail', () => {
  it('should display the name as a header', () => {
    const metric = {
      name: 'Overtime'
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('heading')).toHaveTextContent('Overtime')
  })

  it('should display the total amount headline and value', () => {
    const metric = {
      name: 'Overtime',
      totalExceedingDuration: 'PT4H30M'
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('total-heading')).toHaveTextContent('Exceeding Overtime')
    expect(getByTestId('total-value')).toHaveTextContent('4h 30m')
  })

  it('should display the current exceeding headline and value', () => {
    const metric = {
      name: 'Overtime',
      currentExceedingDuration: 'PT4H30M'
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('current-heading')).toHaveTextContent('Current Exceeding Overtime')
    expect(getByTestId('current-value')).toHaveTextContent('4h 30m')
  })

  it('should display the total amount headline with the Name', () => {
    const metric = {
      name: 'Meetings'
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('total-heading')).toHaveTextContent('Exceeding Meetings')
  })

  it('should show a delete button', () => {
    const {getByTestId} = render(<Detail metric={{}} deleteMetric={() => {}}/>)

    expect(getByTestId('delete-btn')).toBeVisible()
  })

  it('should show a edit button', () => {
    const {getByTestId} = render(<Detail metric={{}}/>)

    expect(getByTestId('edit-btn')).toBeVisible()
  })

  it.skip('should show the graph', () => {
    const metric = {
      values: [
        {
          date: '2020-05-03',
          duration: 'PT40H30M'
        },
        {
          date: '2020-05-11',
          duration: 'PT42H30M'
        },
      ]
    }

    const {getByRole} = render(<Detail metric={metric}/>)

    expect(getByRole('img')).toBeVisible()
  })

  it.skip('should display metric values', () => {
    const metric = {
      name: 'Overtime',
      values: [
        {
          date: '2020-05-11',
          duration: 'PT42H30'
        }
      ]
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('calender-week-2020-05-11')).toHaveTextContent('CW 20')
  })
})
