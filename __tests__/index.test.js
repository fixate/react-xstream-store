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

import XstreamContext from '../src';
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

  test('-> components can dispatch plain actions', () => {
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
    fireEvent.click(button);

    store.state$.compose(buffer(xs.never())).subscribe({
      next(xs) {
        expect(xs[0].counter.value).toBe(2);
        expect(spy).toHaveBeenCalledTimes(2);
      },
    });

    store.state$.shamefullySendComplete();
  });

  test('-> action creators are are automatically bound to dispatch', () => {
    const store = getNewStore();
    const actions = {increment: incrementActionCreator};
    const spy = jest.spyOn(store, 'dispatch');
    const {getByTestId} = renderIntoDocument(
      <Provider value={store}>
	<Consumer actions={actions}>
          {({increment}) => <button data-testid="button" onClick={increment} />}
        </XstreamContext.Consumer>
      </XstreamContext.Provider>
    );
    const button = getByTestId('button');

    fireEvent.click(button);
    fireEvent.click(button);

    store.state$.compose(buffer(xs.never())).subscribe({
      next(xs) {
        expect(xs[0].counter.value).toBe(2);
        expect(spy).toHaveBeenCalledTimes(2);
      },
    });

    store.state$.shamefullySendComplete();
  });
});
