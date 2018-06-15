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
  initialState: IState;
}

export type ActionCreator = (a: any) => IAction;
export type StateSelector = (s: IState) => IState;
export interface IActionMap {
  [key: string]: IAction | ActionCreator;
}

const defaultContextValue: IStoreContext = {
  state$: xs.empty(),
  dispatch: () => {},
  initialState: {},
};

const {
  Provider: OriginalProvider,
  Consumer: OriginalConsumer,
} = React.createContext(defaultContextValue);

export interface IXstreamConnectorProps {
  store: IStoreContext;
  actions: IActionMap;
  selector: StateSelector;
  children?: (a: any) => React.ReactNode;
}

const defaultSelector: StateSelector = state => state;

class XstreamConnector extends React.Component<IXstreamConnectorProps> {
  subscription = {unsubscribe: () => {}};

  componentDidMount() {
    const {store, selector} = this.props;
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
    const {children, store, selector, actions, ...restProps} = this.props;
    const state = this.state
      ? this.state
      : (selector || defaultSelector)(store.initialState);

    return children({
      ...state,
      ...restProps,
      ...actions,
      dispatch: store.dispatch,
    });
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

const XstreamContext = {
  Provider: OriginalProvider,
  Consumer,
};
export {Provider, Consumer, withStream};

export default XstreamContext;
