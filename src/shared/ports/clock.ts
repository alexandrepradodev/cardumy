// Port for "what time is it?". Use cases ask the clock instead of calling
// new Date(), so tests can freeze time and spaced repetition stays testable.
export interface Clock {
  now(): Date;
}
