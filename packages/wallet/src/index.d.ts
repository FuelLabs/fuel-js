import BN from 'bn.js';

interface WalletOptions {
  key?: string;
  network?: string;
}

export class Wallet {
  public address: string;

  constructor(provider: any, options?: any);

  _tokenId(token: any): Promise<any>;
  balance(token: any, options?: any): Promise<any>;
  deposit(token: any, amount: any, opts?: any): Promise<void>;
  transfer(token: any, recipient: any, amount: any, opts?: any): Promise<any>;
  faucet(): Promise<void>;
  _token(id: number): Promise<string>;

  sync(): void;
  withdraw(token: any, amount: any, opts?: any): Promise<any>;
  retrieve(opts?: any): Promise<any>;
  fee(): Promsie<any>

  on(name: string, cb: Function);
  off(name: string);
}

interface Utils {
  parseEther(eth: any): string;
  formatEther(wei: any, unit: string): string;
}

export const utils: Utils;
