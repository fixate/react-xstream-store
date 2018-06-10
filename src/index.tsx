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

export interface IXstreamConnectorProps {
  store: IStoreContext;
  actions: IActionMap;
  selector: StateSelector;
  children?: (a: any) => React.ReactNode;
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
    const {children, store, ...restProps} = this.props;

    return children({...this.state, ...restProps, dispatch: store.dispatch});
  }
}

export interface IXstreamConsumerProps {
  selector: StateSelector;
  actions: IActionMap;
  children: () => React.ReactNode;
}

const XstreamConsumer: React.SFC<IXstreamConsumerProps> = ({
  selector,
  actions,
  children,
}) => (
  <Consumer>
    {(store: IStoreContext) => (
      <XstreamConnector
        children={children}
        store={store}
        selector={selector}
        actions={actions}
      />
    )}
  </Consumer>
);

export default {
  Provider,
  Consumer: XstreamConsumer,
};
