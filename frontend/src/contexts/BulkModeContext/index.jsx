import React, {createContext, useContext, useState} from 'react'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'

const BulkModeContext = createContext()

export const BulkModeProvider = ({children}) => {
  const [bulkSelectModeEnabled, setBulkSelectModeEnabled] = useState(false)
  const [selectedActivities, setSelectedActivities] = useState([])
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {del, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

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
    request(del('activities', selectedActivities)
      .then(() => {
        window.location.reload()
      }))
      .with('DELETE_SELECTED_ACTIVITIES')
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
