// Test stand-in for lightning/refresh, which sfdx-lwc-jest does not stub.
export class RefreshEvent extends CustomEvent {
  constructor() {
    super('lightning__refresh', { bubbles: true, composed: true });
  }
}
