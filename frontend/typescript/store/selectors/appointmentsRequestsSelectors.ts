import { createSelector } from 'reselect';
import { RootState } from '../rootReducer';

const state = ({ appointmentsRequests }: RootState) => appointmentsRequests;

export const appointmentsRequestsSelector = createSelector(state, ({ appointmentsRequests }) => appointmentsRequests);
export const appointmentRequestSelector = createSelector(state, ({ appointmentRequest }) => appointmentRequest);
