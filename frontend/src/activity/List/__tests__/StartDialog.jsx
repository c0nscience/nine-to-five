import '@testing-library/jest-dom'

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import StartDialog from 'activity/List/StartDialog'

describe('Start Dialog', () => {
  it('should have a name input field', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    expect(getByTestId('name')).toBeVisible()
  })

  it('should have a tags input field', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    expect(getByTestId('tags')).toBeVisible()
  })

  it('should have a start button', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    expect(getByTestId('start-btn')).toBeVisible()
  })

  it('should have a cancel button', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    expect(getByTestId('cancel-btn')).toBeVisible()
  })

  it('should have a change start time checkbox', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    expect(getByTestId('change-start-time')).not.toBeChecked()
    expect(getByTestId('change-start-time')).toBeVisible()
  })

  it('should show a time picker if the change start time checkbox is ticked', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    fireEvent.click(getByTestId('change-start-time'))

    expect(getByTestId('change-start-time')).toBeChecked()
    expect(getByTestId('change-start-time')).toBeVisible()
  })
})
