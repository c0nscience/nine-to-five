import '@testing-library/jest-dom'

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import {StartDialog} from 'activity/List/StartDialog'
import {within} from '@testing-library/dom'

describe('Opening the Start Dialog', () => {
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

  it('should not show the start time picker by default', () => {
    const {queryByTestId} = render(<StartDialog open={true}/>)

    expect(queryByTestId('start-time-picker')).toBeNull()
  })

  it('should show a time picker if the change start time checkbox is ticked', () => {
    const {getByTestId} = render(<StartDialog open={true}/>)

    const checkboxWrapper = getByTestId('change-start-date-time')

    fireEvent.click(checkboxWrapper)

    expect(getByTestId('start-date-time-picker')).toBeVisible()
  })

  it('should show repeat checkbox', () => {
    const {queryByTestId} = render(<StartDialog open={true}/>)

    expect(queryByTestId('repeat-activity')).not.toBeNull()
  })

  describe('checking the repeat checkbox', () => {
    const triggerRepeatCheckbox = () => {
      const {getByTestId, queryByTestId} = render(<StartDialog open={true}/>)

      const checkboxWrapper = getByTestId('repeat-activity')

      fireEvent.click(checkboxWrapper)

      return {getByTestId, queryByTestId}
    }

    it('should hide start date time picker if repeat is checked', () => {
      const {getByTestId} = render(<StartDialog open={true}/>)
      const changeStartDateTimeCheckbox = getByTestId('change-start-date-time')
      fireEvent.click(changeStartDateTimeCheckbox)

      const checkboxWrapper = getByTestId('repeat-activity')
      fireEvent.click(checkboxWrapper)

      const {getByRole} = within(getByTestId('change-start-date-time'))
      expect(getByRole('checkbox')).not.toBeChecked()
    })

    it('should show start time picker', () => {
      const {getByTestId} = triggerRepeatCheckbox()
      expect(getByTestId('start-time')).toBeVisible()
    })

    it('should show end time picker', () => {
      const {getByTestId} = triggerRepeatCheckbox()
      expect(getByTestId('end-time')).toBeVisible()
    })

    it('should show a start date picker', () => {
      const {getByTestId} = triggerRepeatCheckbox()
      expect(getByTestId('start-date')).toBeVisible()
    })

    it('should show a end time picker', () => {
      const {getByTestId} = triggerRepeatCheckbox()
      expect(getByTestId('end-date')).toBeVisible()
    })

    it('should show an apply button instead of a start button', () => {
      const {getByTestId, queryByTestId} = triggerRepeatCheckbox()
      expect(queryByTestId('start-btn')).toBeNull()
      expect(getByTestId('apply-btn')).toBeVisible()
    })

    describe('week day selector', () => {
      it('monday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('monday')).toBeVisible()
      })

      it('tuesday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('tuesday')).toBeVisible()
      })

      it('wednesday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('wednesday')).toBeVisible()
      })

      it('thursday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('thursday')).toBeVisible()
      })

      it('friday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('friday')).toBeVisible()
      })

      it('saturday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('saturday')).toBeVisible()
      })

      it('sunday', () => {
        const {getByTestId} = triggerRepeatCheckbox()
        expect(getByTestId('sunday')).toBeVisible()
      })
    })
  })
})
