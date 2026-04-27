export {};

declare global {
  export class OtpConfig {
    website: string;
    account: string;
    secret: string;
    code: string;
    uri: string;
  }

  export interface Preps {
    authFile: string;
  }
}
