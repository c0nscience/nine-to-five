import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import ActivityForm from './activity/ActivityForm'
import ActivityList from './activity/ActivityList'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <h2>Welcome to React</h2>
        </div>
        <div className="nine-to-five-app">
          <ActivityForm/>
          <ActivityList/>
        </div>
      </div>
    )
  }
}

export default App
