import '@testing-library/jest-dom'

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import DayPicker from '../DayPicker'
import {DateTime} from 'luxon'

describe('Day Picker', () => {
  it('should display a given date as text', () => {
    const date = DateTime.fromISO("2020-05-22")

    const {getByTestId} = render(<DayPicker date={date}/>)

    expect(getByTestId('label')).toHaveTextContent('May 22, 2020')
  })

  it('should display next button', () => {
    const {getByTestId} = render(<DayPicker/>)

    expect(getByTestId('next')).toBeVisible()
  })

  it('should display next date after clicking the next button', () => {
    const date = DateTime.fromISO("2020-05-22")

    const {getByTestId} = render(<DayPicker date={date}/>)

    const nextButton = getByTestId('next')
    fireEvent.click(nextButton)

    expect(getByTestId('label')).toHaveTextContent('May 23, 2020')
  })

  it('should display previous date after clicking the previous button', () => {
    const date = DateTime.fromISO("2020-05-22")

    const {getByTestId} = render(<DayPicker date={date}/>)

    fireEvent.click(getByTestId('previous'))

    expect(getByTestId('label')).toHaveTextContent('May 21, 2020')
  })

  it('should call onChanged function after the next button is clicked with the new value', () => {
    const date = DateTime.fromISO("2020-05-22")

    const onChanged = jest.fn()
    const {getByTestId} = render(<DayPicker date={date} onChanged={onChanged}/>)

    fireEvent.click(getByTestId('next'))

    expect(onChanged).toHaveBeenCalled()
    expect(onChanged.mock.calls[0][0]).toEqual(DateTime.fromISO("2020-05-23"))
  })

  it('should call onChanged function after the previous button is clicked with the new value', () => {
    const date = DateTime.fromISO("2020-05-22")

    const onChanged = jest.fn()
    const {getByTestId} = render(<DayPicker date={date} onChanged={onChanged}/>)

    fireEvent.click(getByTestId('previous'))

    expect(onChanged).toHaveBeenCalled()
    expect(onChanged.mock.calls[0][0]).toEqual(DateTime.fromISO("2020-05-21"))
  })
})
