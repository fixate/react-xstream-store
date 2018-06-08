import * as React from 'react';
import XstreamContext from '../src/Context';

interface IDivToTestProps {
  state$: {
    [key: string]: object;
  };
}

class DivToTest extends React.Component<IDivToTestProps, {}> {
  render() {
    const {state$} = this.props;

    return <div>{state$}</div>;
  }
}

describe('Provider', () => {
  test('-> makes state available to components via context', () => {
    expect(false).toBe(true);
  });
});
