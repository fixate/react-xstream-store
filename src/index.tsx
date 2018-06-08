import * as React from 'react';
import xs, {Stream} from 'xstream';
import {IAction, IDispatch} from 'xstream-store';

export interface IState {
  [key: string]: any;
}

export type State$ = Stream<IState>;

export interface IStoreContext {
  state$: State$;
  dispatch: IDispatch;
}

export type ActionCreator = (a: any) => IAction;
export type StateSelector = (s: IState) => IState;
export interface IActionMap {
  [key: string]: IAction | ActionCreator;
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

export interface IXstreamConnectorProps {
  store: IStoreContext;
  actionMap: IActionMap;
  selector: StateSelector;
  children: () => React.ReactNode;
}

class XstreamConnector extends React.Component<IXstreamConnectorProps> {
  subscription = {unsubscribe: () => {}};

  componentDidMount() {
    const {store, selector} = this.props;
    const defaultSelector: StateSelector = state => state;
    const selected$ = store.state$.map(selector || defaultSelector);

    this.subscription = selected$.subscribe({
      next: state => {
        this.setState(state);
      },
      error(e) {
        throw Error(e);
      },
      complete() {},
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const {children, store} = this.props;
    const WrappedComponent = children();

    return <WrappedComponent {...this.state} dispatch={store.dispatch} />;
  }
}

export interface IXstreamConsumerProps {
  selector: StateSelector;
  actions: IActionMap;
}

const XstreamConsumer: React.SFC<IXstreamConsumerProps> = ({
  selector,
  actions,
}) => (
  <Consumer>
    {(store: IStoreContext) => (
      <XstreamConnector store={store} selector={selector} actions={actions} />
    )}
  </Consumer>
);

class XstreamContext extends React.Component {
  Provider = Provider;
  Consumer = XstreamConsumer;
}

export default XstreamContext;
