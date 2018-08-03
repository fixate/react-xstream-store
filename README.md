# react-xstream-store

[![Build Status](https://travis-ci.org/fixate/react-xstream-store.svg?branch=master)](https://travis-ci.org/fixate/react-xstream-store)
[![npm version](https://badge.fury.io/js/react-xstream-store.svg)](https://badge.fury.io/js/react-xstream-store)
[![codecov](https://codecov.io/gh/fixate/react-xstream-store/branch/master/graph/badge.svg)](https://codecov.io/gh/fixate/react-xstream-store)

React components for connecting an [xstream-store](https://github.com/fixate/xstream-store) store to your components.

## Installation

```
npm i react-xstream-store xstream-store xstream
```

## Usage

`react-xstream-store` exports a `Provider` to make your `xstream` store
available through `context`, and exports a `Consumer` and `withStream` HOC to
access state in the store.

### Provider

```javascript
// App.js
import React from 'react';
import {Provider} from 'react-xstream-store';

import store from './my-xstream-store';

import Counter from './Counter';

const App = () =>
  <Provider store={store}>
    <Couunter />
  </Provider>
```

| Prop  | Description                     |
|-------|---------------------------------|
| store | An `xstream-store` store object |

### Consumer

A typical React context consumer that expects a function for `children`,
returning bound action creators and state from the store.

```javascript
// Counter.js
import React from 'react';
import {Consumer} from 'react-xstream-store'

import {decrementAction, incrementAction} from './my-counter-stream';

const selector = state => {
  return {count: state.count};
};
const actionMap = {
  decrement: decrementAction,
  increment: incrementAction,
}

const Counter = () =>
  <Consumer selector={selector} actions={actions}>
    {({count, decrement, increment}) =>
      <div>
        <button onClick={decrement}>-</button>
        {count}
        <button onClick={decrement}>+</button>
      </div>
    }
  </Consumer>

export default Counter;
```

| Prop     | Type                               | Description                                                                                                                                         |
|----------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| selector | fn: (state) => state               | A function that receives the entire store's state.  This is a good place to select only the state from the store your component requires.           |
| actions  | obj: {key: actionCreator \| action} | An object mapping keys to action creators.  Action creators (functions which return actions) are automatically bound to `xstream-store`'s dispatch. |

### withStream

A higher-order component and alternative to the `Consumer` component for making
actions and state available within a component.

```javascript
// Counter.js
import React from 'react';
import {withProps} from 'react-xstream-store'

import {decrementAction, incrementAction} from './my-counter-stream';

const Counter = ({count, decrement, increment}) =>
  <div>
    <button onClick={decrement}>-</button>
    {count}
    <button onClick={decrement}>+</button>
  </div>

const selector = state => {
  return {count: state.count};
};
const actions = {
  decrement: decrementAction,
  increment: incrementAction,
}

export default withStream(selector, actions)(Counter);
```

## Todo

- [ ] add examples

## License

MIT
