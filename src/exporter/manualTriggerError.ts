/* eslint-disable @typescript-eslint/no-explicit-any */
export class ManualTriggerError extends Error {
  constructor(
    message?: string,
    public properties?: { [key: string]: any },
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = ManualTriggerError.name;
  }
}
