import * as React from 'react';
import {render} from 'react-testing-library';

import XstreamContext from '../src';
import store from './store';

// $ node --inspect $(npm bin)/jest --watch

describe('Provider', () => {
  test('-> makes state available to components via context', () => {
    const root = render(
      <XstreamContext.Provider value={store}>
        <XstreamContext.Consumer>
          {({dispatch, state}) => <div>{state.value}</div>}
        </XstreamContext.Consumer>
      </XstreamContext.Provider>
    );

    expect(false).toBe(true);
  });
});
