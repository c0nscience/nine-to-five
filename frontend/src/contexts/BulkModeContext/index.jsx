import React, {createContext, useContext, useState} from 'react'

const BulkModeContext = createContext()

export const BulkModeProvider = ({children}) => {
  const [bulkSelectModeEnabled, setBulkSelectModeEnabled] = useState(false)
  const [selectedActivities, setSelectedActivities] = useState([])

  const switchBulkSelectMode = () => {
    setBulkSelectModeEnabled(s => {
      const newValue = !s
      if (!newValue) {
        setSelectedActivities([])
      }
      return newValue
    })
  }

  const addToBulkSelection = id => {
    setSelectedActivities(s => [...s, id])
  }

  const removeFromBulkSelection = id => {
    setSelectedActivities(s => {
      const index = s.findIndex(i => i === id)
      return [
        ...s.slice(0, index),
        ...s.slice(index + 1)
      ]
    })
  }

  const bulkDeleteSelection = () => {
    console.log('delete all', selectedActivities)
    //TODO add API
  }

  return <BulkModeContext.Provider value={{
    bulkSelectModeEnabled,
    selectedActivities,
    switchBulkSelectMode,
    addToBulkSelection,
    removeFromBulkSelection,
    bulkDeleteSelection
  }}>
    {children}
  </BulkModeContext.Provider>
}

export const useBulkMode = () => useContext(BulkModeContext)
