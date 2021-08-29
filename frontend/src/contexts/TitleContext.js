import React, {createContext, useContext, useState} from 'react'

const TitleContext = createContext()

const DEFAULT_TITLE = 'Nine to Five'

export const TitleProvider = ({children}) => {
  const [title, setTitle] = useState(DEFAULT_TITLE)

  return <TitleContext.Provider value={{
    title, setTitle
  }}>
    {children}
  </TitleContext.Provider>
}

export const useTitle = () => useContext(TitleContext)
