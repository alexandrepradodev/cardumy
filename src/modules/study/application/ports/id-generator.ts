// Port for creating ids. Tests use predictable ids ("deck-1"), production uses UUIDs.
export interface IdGenerator {
  next(): string;
}
