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
      <Provider value={store}>
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
      <Provider value={store}>
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
      <Provider value={store}>
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
      <Provider value={store}>
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

  test('-> components can be connected via a HOC', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const MyComp = ({counter}) => (
      <div data-testid="counter-container">{counter.value}</div>
    );
    const MyConnectedComponent = withStream()(MyComp);
    const {getByTestId} = renderIntoDocument(
      <Provider value={store}>
        <MyConnectedComponent />
      </Provider>
    );
    const counterContainer = getByTestId('counter-container');

    expect(counterContainer).toHaveTextContent('0');
  });
});
