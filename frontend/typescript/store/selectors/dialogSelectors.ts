import { createSelector } from 'reselect';
import { RootState } from '../rootReducer';

const state = ({ dialog }: RootState) => dialog;

export const dialogSelector = createSelector(state, dialog => dialog);