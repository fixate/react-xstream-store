import * as React from 'react';
import xs, {Stream} from 'xstream';
import {IAction, IDispatch} from 'xstream-store';

export interface IState {
  [key: string]: any;
}

export type State$ = Stream<IState>;

export type ActionCreator = (...xs: any[]) => IAction;
export type StateSelector = (s: IState, props?: {[key: string]: any}) => IState;
export interface IActionMap {
  [key: string]: IAction | ActionCreator;
}

export interface IStoreContext {
  streamState: IState;
  dispatch: IDispatch;
}

const defaultContextValue: IStoreContext = {
  streamState: {},
  dispatch: () => {},
};

const {
  Provider: OriginalProvider,
  Consumer: OriginalConsumer,
} = React.createContext(defaultContextValue);

const defaultSelector: StateSelector = state => state;

export type IActionBinder = (...xs: any[]) => void;

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

export interface IXstreamConnectConsumerProps {
  streamState: IState;
  dispatch: IDispatch;
  actions?: IActionMap;
  selector?: StateSelector;
  children?: (a: any) => React.ReactNode;
}

class XstreamConnectConsumer extends React.Component<
  IXstreamConnectConsumerProps
> {
  render() {
    const {
      actions,
      children,
      dispatch,
      selector,
      streamState,
      ...restProps
    } = this.props;
    const boundActions = getBoundActions(actions, dispatch);
    const mappedState = (selector || defaultSelector)(streamState, restProps);

    return children({
      ...restProps,
      ...boundActions,
      ...mappedState,
      dispatch,
    });
  }
}

export interface IConsumerProps {
  actions?: IActionMap;
  children: (...props: any[]) => React.ReactNode;
  selector?: StateSelector;
  ref?: React.RefObject<any>;
}

export interface IXstreamProviderProps {
  store: {
    state$: State$;
    dispatch: IDispatch;
    initialState: IState;
  };
}

class Provider extends React.Component<IXstreamProviderProps, IState> {
  displayName = 'XstreamProvider';

  subscription = {unsubscribe: () => {}};

  componentDidMount() {
    const {store} = this.props;

    this.subscription = store.state$.subscribe({
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
    const streamState = this.state || store.initialState;

    return (
      <OriginalProvider
        children={children}
        value={{streamState, dispatch: store.dispatch}}
      />
    );
  }
}

class Consumer extends React.Component<IConsumerProps> {
  displayName = 'XstreamConsumer';

  render() {
    const {selector, actions, children, ...restProps} = this.props;

    return (
      <OriginalConsumer>
        {(props: IStoreContext) => (
          <XstreamConnectConsumer
            actions={actions}
            children={children}
            dispatch={props.dispatch}
            selector={selector}
            streamState={props.streamState}
            {...restProps}
          />
        )}
      </OriginalConsumer>
    );
  }
}

const XstreamContext = {
  Consumer,
  Provider,
};

type ComponentToWrap = string | React.ComponentType<any>;

const withStream = (selector?: StateSelector, actions?: IActionMap) => (
  ComponentToWrap: ComponentToWrap
) => {
  return class extends React.Component<{
    innerRef?: React.RefObject<any>;
    [key: string]: any;
  }> {
    static displayName = `withXstream(${(ComponentToWrap as React.ComponentClass)
      .displayName || 'Unknown'})`;

    public render() {
      const {innerRef, ...restProps} = this.props;

      return (
        <Consumer
          {...restProps}
          actions={actions}
          children={(consumerProps: any) => (
            <ComponentToWrap {...consumerProps} {...restProps} />
          )}
          ref={innerRef}
          selector={selector}
        />
      );
    }
  };
};

export {Provider, Consumer, withStream};

export default XstreamContext;
