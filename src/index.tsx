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

export type ActionCreator = (...xs: any[]) => IAction;
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

export type IActionBinder = (...xs: any[]) => void;

const defaultSelector: StateSelector = state => state;

const getBoundActions = (
  actions: IActionMap = {},
  dispatch: IDispatch
): IActionMap => {
  const boundActions = Object.keys(actions).reduce((acc, actionName) => {
    const action: ActionCreator | IAction = actions[actionName];
    const isActionCreator = typeof action === 'function';
    const actionToReturn: IActionBinder | IAction = isActionCreator
      ? (...args) => dispatch((action as ActionCreator)(...args))
      : action;

    return {...acc, [actionName]: actionToReturn};
  }, {});

  return boundActions;
};

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
    const boundActions = getBoundActions(actions, store.dispatch);
    const streamState = this.state
      ? this.state
      : (selector || defaultSelector)(store.initialState);

    return children({
      ...streamState,
      ...boundActions,
      ...restProps,
      dispatch: store.dispatch,
    });
  }
}

export interface IConsumerProps {
  actions: IActionMap;
  children: (...props: any[]) => React.ReactNode;
  selector: StateSelector;
}

const Provider = OriginalProvider;
Provider.displayName = 'XstreamProvider';

const Consumer: React.SFC<IConsumerProps> = ({selector, actions, children}) => (
  <OriginalConsumer>
    {(store: IStoreContext) => (
      <XstreamConnector
        actions={actions}
        children={children}
        selector={selector}
        store={store}
      />
    )}
  </OriginalConsumer>
);
Consumer.displayName = 'XstreamConsumer';

const XstreamContext = {
  Provider: OriginalProvider,
  Consumer,
};

const withStream = (selector: StateSelector, actions: IActionMap) => (
  ComponentToWrap: React.ComponentClass
) => () => (
  <Consumer
    selector={selector}
    actions={actions}
    children={(props: any) => <ComponentToWrap {...props} />}
  />
);

export {Provider, Consumer, withStream};

export default XstreamContext;
