import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import Detail from '../Detail'

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
      total: 'PT4H30M',
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('total-heading')).toHaveTextContent('Total Overtime')
    expect(getByTestId('total-value')).toHaveTextContent('4h 30m')
  })

  it('should display the current amount headline and value', () => {
    const metric = {
      name: 'Overtime',
      current: 'PT2H00M',
    }

    const {getByTestId} = render(<Detail metric={metric}/>)

    expect(getByTestId('current-heading')).toHaveTextContent('Current Overtime')
    expect(getByTestId('current-value')).toHaveTextContent('2h 0m')
  })
})
