import { createSelector } from 'reselect';
import { RootState } from '../rootReducer';

const state = ({ notifications }: RootState) => notifications;

export const lastNotificationSelector = createSelector(state, ({ lastNotification }) => lastNotification);
export const connectionIsOpenSelector = createSelector(state, ({ isOpen }) => isOpen);
