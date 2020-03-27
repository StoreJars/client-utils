import { createSelector } from 'reselect';
import { handleActions } from 'redux-actions';
import { produce } from 'immer';
import { combineEpics } from 'redux-observable';

import { createMetaReducer, selectEntitiesMeta, selectEntities } from '../state';
import { ofType, catchError, switchMap, of } from '../operators';
import { authApi } from '../api';
import { responder } from '../helpers';
import namespaces from '../namespaces';
import Actions from '../actions';
import { selector as tokenSelector } from './login';

export const action = new Actions(namespaces.CUSTOMERS);

export const selector = createSelector(selectEntities, state => state.customers.data);
export const metaSelector = createSelector(selectEntitiesMeta, state => state.customers);
export const readMetaSelector = createSelector(metaSelector, state => state.read);

export const reducer = handleActions({
  [action.read.success]: (state, action$) => produce(state, draft => {
    draft.data.push(action$.payload);
    return draft
  }),
}, { data: [] });

export const metaReducer = createMetaReducer(action);

export function readEpic(action$, store$) {
  return action$
    .pipe(
      ofType(action.read.loading),
      switchMap(({ payload }) => {
        const { token } = tokenSelector(store$.value);
        return authApi.get$('/customers', token)
          .pipe(
            switchMap(({ response }) => {
              return of(action.readAction(response.data).success)
            }),
            catchError(({ response }) => of(action.readAction(responder(response)).error)),
          );
      }),
    );
}

export const epic = combineEpics(readEpic) 