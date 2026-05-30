export const AUTH_SIGN_IN_RETRY_TIMEOUT_MS = 30_000;

export interface AuthSignInPendingState {
  isSignInPending: boolean;
  isStartInFlight: boolean;
  shouldScheduleRetry: boolean;
}

export type AuthSignInPendingEvent =
  | { type: "released" }
  | { type: "start_completed"; started: boolean }
  | { type: "start_requested" };

export const initialAuthSignInPendingState: AuthSignInPendingState = {
  isSignInPending: false,
  isStartInFlight: false,
  shouldScheduleRetry: false,
};

export const reduceAuthSignInPendingState = (
  _state: AuthSignInPendingState,
  event: AuthSignInPendingEvent,
): AuthSignInPendingState => {
  if (event.type === "start_requested") {
    return {
      isSignInPending: true,
      isStartInFlight: true,
      shouldScheduleRetry: false,
    };
  }

  if (event.type === "start_completed" && event.started) {
    return {
      isSignInPending: true,
      isStartInFlight: false,
      shouldScheduleRetry: true,
    };
  }

  return initialAuthSignInPendingState;
};
