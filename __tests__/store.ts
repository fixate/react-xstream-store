import createStore from 'xstream-store';

import {createCounter$} from './counter-stream';

const streamCreators = {
  counter: createCounter$,
};

const store = createStore(streamCreators, []);

export default store;
