import * as React from "react";
import xs, { Stream } from "xstream";
import { Action, Dispatch } from "xstream-store";

export interface State {
  [key: string]: any;
}

export type State$ = Stream<State>;

export type ActionCreator = (...xs: any[]) => Action;
export type StateSelector = (s: State, props?: { [key: string]: any }) => State;
export interface ActionMap {
  [key: string]: Action | ActionCreator;
}

export interface StoreContext {
  streamState: State;
  dispatch: Dispatch;
}

const defaultContextValue: StoreContext = {
  streamState: {},
  dispatch: () => {}
};

const {
  Provider: OriginalProvider,
  Consumer: OriginalConsumer
} = React.createContext(defaultContextValue);

const defaultSelector: StateSelector = state => state;

export type ActionBinder = (...xs: any[]) => void;

const getBoundActions = (
  actions: ActionMap = {},
  dispatch: Dispatch
): ActionMap => {
  const boundActions = Object.keys(actions).reduce((acc, actionName) => {
    const action: ActionCreator | Action = actions[actionName];
    const isActionCreator = typeof action === "function";
    const actionToReturn: ActionBinder | Action = isActionCreator
      ? (...args) => dispatch((action as ActionCreator)(...args))
      : action;

    return { ...acc, [actionName]: actionToReturn };
  }, {});

  return boundActions;
};

export interface XstreamConnectConsumerProps {
  streamState: State;
  dispatch: Dispatch;
  actions?: ActionMap;
  selector?: StateSelector;
  children?: (a: any) => React.ReactNode;
}

class XstreamConnectConsumer extends React.Component<
  XstreamConnectConsumerProps
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
      dispatch
    });
  }
}

export interface ConsumerProps {
  actions?: ActionMap;
  children: (...props: any[]) => React.ReactNode;
  selector?: StateSelector;
  ref?: React.RefObject<any>;
}

export interface XstreamProviderProps {
  store: {
    state$: State$;
    dispatch: Dispatch;
    initialState: State;
  };
}

class Provider extends React.Component<XstreamProviderProps, State> {
  displayName = "XstreamProvider";

  subscription = { unsubscribe: () => {} };

  componentDidMount() {
    const { store } = this.props;

    this.subscription = store.state$.subscribe({
      next: state => {
        this.setState(state);
      },
      error(e) {
        throw Error(e);
      },
      complete() {}
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const { children, store } = this.props;
    const streamState = this.state || store.initialState;

    return (
      <OriginalProvider
        children={children}
        value={{ streamState, dispatch: store.dispatch }}
      />
    );
  }
}

class Consumer extends React.Component<ConsumerProps> {
  displayName = "XstreamConsumer";

  render() {
    const { selector, actions, children, ...restProps } = this.props;

    return (
      <OriginalConsumer>
        {(props: StoreContext) => (
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
  Provider
};

type ComponentToWrap = string | React.ComponentType<any>;

export type WithStream = (selector?: StateSelector | null, actions?: ActionMap | null) => any;

const withStream: WithStream = (selector, actions) => (
  ComponentToWrap: ComponentToWrap
) => {
  return class extends React.Component<{
    innerRef?: React.RefObject<any>;
    [key: string]: any;
  }> {
    static displayName = `withXstream(${(ComponentToWrap as React.ComponentClass)
      .displayName || "Unknown"})`;

    public render() {
      const { innerRef, ...restProps } = this.props;

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

export { Provider, Consumer, withStream };

export default XstreamContext;
