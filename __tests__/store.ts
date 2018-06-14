import createStore from 'xstream-store';

import {createCounter$} from './counter-stream';

const streamCreators = {
  counter: createCounter$,
};

const getNewStore = () => createStore(streamCreators, []);

export {getNewStore};
