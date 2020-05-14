import React from 'react';
import {createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import {blue, blueGrey, deepOrange, deepPurple, indigo, pink, red} from '@material-ui/core/colors'
import CssBaseline from '@material-ui/core/CssBaseline';

// A theme with custom primary and secondary color.
// It's optional.
const theme = createMuiTheme({
  palette: {
    // type: 'dark',
    // primary: indigo,
    // secondary: pink,
  },
});

function withRoot(Component) {
  function WithRoot(props) {
    // MuiThemeProvider makes the theme available down the React tree
    // thanks to React context.
    return (
      <MuiThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline/>
        <Component {...props} />
      </MuiThemeProvider>
    );
  }

  return WithRoot;
}

export default withRoot;
