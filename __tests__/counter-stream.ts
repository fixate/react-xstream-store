import xs from 'xstream';
import {IAction} from 'xstream-store';

export const INCREMENT_TYPE = 'increment';
export const increment = (): IAction => ({type: INCREMENT_TYPE});

const initialState = {value: 0};

const createCounter$ = select =>
  xs
    .merge(
      select(INCREMENT_TYPE).map(action => state => ({
        ...state,
        value: state.value + 1,
      }))
    )
    .startWith(() => initialState);

export {createCounter$};
