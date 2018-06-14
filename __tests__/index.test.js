import * as React from 'react';
import {render} from 'react-testing-library';
import 'jest-dom/extend-expect';

import XstreamContext from '../src';
import {getNewStore} from './store';

describe('Provider', () => {
  test('-> makes state available to components via context', () => {
    const store = getNewStore();
    const {container, getByTestId} = render(
      <XstreamContext.Provider value={store}>
        <XstreamContext.Consumer>
          {({counter}) => (
            <div data-testid="counter-container">{counter.value}</div>
          )}
        </XstreamContext.Consumer>
      </XstreamContext.Provider>
    );
    const counterContainer = getByTestId('counter-container');

    expect(counterContainer).toHaveTextContent('0');
  });
    const store = getNewStore();
});
