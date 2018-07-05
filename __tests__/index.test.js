import * as React from 'react';
import xs from 'xstream';
import buffer from 'xstream/extra/buffer';
import {
  cleanup,
  fireEvent,
  render,
  renderIntoDocument,
} from 'react-testing-library';
import 'jest-dom/extend-expect';

import {Consumer, Provider, withStream} from '../src';
import {getNewStore} from './store';
import {incrementAction, incrementActionCreator} from './counter-stream';

describe('XstreamContext', () => {
  test('-> makes state available to components via context', () => {
    const store = getNewStore();
    const {container, getByTestId} = render(
      <Provider store={store}>
        <Consumer>
          {({counter}) => (
            <div data-testid="counter-container">{counter.value}</div>
          )}
        </Consumer>
      </Provider>
    );
    const counterContainer = getByTestId('counter-container');

    expect(counterContainer).toHaveTextContent('0');
  });

  test('-> components can manually dispatch actions', () => {
    const store = getNewStore();
    const actions = {increment: incrementAction};
    const spy = jest.spyOn(store, 'dispatch');
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <Consumer actions={actions}>
          {({dispatch, increment}) => (
            <button data-testid="button" onClick={() => dispatch(increment)} />
          )}
        </Consumer>
      </Provider>
    );
    const button = getByTestId('button');

    fireEvent.click(button);

    store.state$.compose(buffer(xs.never())).subscribe({
      next(xs) {
        expect(xs[0].counter.value).toBe(1);
        expect(spy).toHaveBeenCalledTimes(1);
      },
    });

    store.state$.shamefullySendComplete();
  });

  test('-> components can execute actionCreators without dispatch', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const spy = jest.spyOn(store, 'dispatch');
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <Consumer actions={actions}>
          {({increment}) => <button data-testid="button" onClick={increment} />}
        </Consumer>
      </Provider>
    );
    const button = getByTestId('button');

    fireEvent.click(button);

    store.state$.compose(buffer(xs.never())).subscribe({
      next(xs) {
        expect(xs[0].counter.value).toBe(1);
        expect(spy).toHaveBeenCalledTimes(1);
      },
    });

    store.state$.shamefullySendComplete();
  });

  test('-> actionCreators are invoked with all parameters', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const spy = jest.spyOn(actions, 'increment');
    const args = ['foo', 'bar'];
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <Consumer actions={actions}>
          {({increment}) => (
            <button data-testid="button" onClick={() => increment(...args)} />
          )}
        </Consumer>
      </Provider>
    );
    const button = getByTestId('button');

    fireEvent.click(button);

    store.state$.compose(buffer(xs.never())).subscribe({
      next(xs) {
        expect(xs[0].counter.value).toBe(1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(...args);
      },
    });

    store.state$.shamefullySendComplete();
  });

  test('-> props passed down to Consumer are available to state selector', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const props = {foo: 'bar'};
    const selector = (_, passedProps) => ({text: passedProps.foo});
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <Consumer actions={actions} selector={selector} {...props}>
          {({text}) => <div data-testid="div">{text}</div>}
        </Consumer>
      </Provider>
    );
    const div = getByTestId('div');

    expect(div).toHaveTextContent(props.foo);
  });

  test('-> components can be connected via a HOC', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const MyComp = ({counter}) => (
      <div data-testid="counter-container">{counter.value}</div>
    );
    const MyConnectedComponent = withStream()(MyComp);
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <MyConnectedComponent />
      </Provider>
    );
    const counterContainer = getByTestId('counter-container');

    expect(counterContainer).toHaveTextContent('0');
  });

  test('-> HOC passes down props', () => {
    const store = getNewStore();
    const propToPass = {prop1: 'foo', prop2: 'bar'};
    const actions = {increment: incrementActionCreator};
    const MyComp = ({prop1, prop2}) => (
      <div>
        <div data-testid="p1">{prop1}</div>;
        <div data-testid="p2">{prop2}</div>;
      </div>
    );
    const MyConnectedComponent = withStream()(MyComp);
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
        <MyConnectedComponent {...propToPass} />
      </Provider>
    );

    expect(getByTestId('p1')).toHaveTextContent(propToPass.prop1);
    expect(getByTestId('p2')).toHaveTextContent(propToPass.prop2);
  });

  test('-> props passed down to HOC are available to state selector', () => {
    const store = getNewStore();
    const props = {foo: 'bar'};
    const selector = (_, passedProps) => ({text: passedProps.foo});
    const MyComp = ({text}) => <div data-testid="div">{text}</div>;
    const MyConnectedComponent = withStream(selector)(MyComp);
    const {getByTestId} = renderIntoDocument(
      <Provider store={store}>
	<MyConnectedComponent {...props} />
      </Provider>
    );

    expect(getByTestId('div')).toHaveTextContent(props.foo);
  });
});
