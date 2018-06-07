import * as React from 'react';
import xs, {Stream} from 'xstream';
import {IDispatch} from 'xstream-store';

export interface IStoreContext {
  state$: Stream<{[key: string]: any}>;
  dispatch: IDispatch;
}

const defaultContextValue: IStoreContext = {
  state$: xs.empty(),
  dispatch: () => {},
};

const {Provider, Consumer} = React.createContext(defaultContextValue);

// Consumer is a render prop accepting a function
// Wrap connector in Consumer, passing in state$ and dispatch
// XstreamConsumer must also accept selector and actions
// it then creates a subscription based on selected$

class XstreamConnector extends React.Component<any> {}

const XstreamConsumer = ({selector, actions}) =>
  <Consumer>
    ({state$, dispatch}: IStoreContext) =>
      <XstreamConnector
        state$={state$}
        dispatch={dispatch}
        selector={selector}
        actions={actions}
      />
  </Consumer>

class XstreamContext extends React.Component {
  Provider = Provider;
  Consumer = XstreamConsumer;
}

export default XstreamContext;
