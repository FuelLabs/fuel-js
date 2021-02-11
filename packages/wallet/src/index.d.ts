import BN from 'bn.js';

interface WalletOptions {
  key?: string;
  network?: string;
}

export class Wallet {
  public address: string;

  constructor(provider: any, options?: any);

  balance(token: any, options?: any): Promise<any>;
  deposit(token: any, amount: any, opts?: any): Promise<void>;
  transfer(token: any, recipient: any, amount: any, opts?: any): Promise<any>;
  estimateGasCost(token: any, recipient: any, amount: any, opts?: any): Promise<any>;
  faucet(): Promise<void>;
  _tokenId(token: any): Promise<any>;
  _token(id: number): Promise<string>;

  sync(): Promise<void>;
  withdraw(token: any, amount: any, opts?: any): Promise<any>;
  retrieve(token: any, opts?: any): Promise<any>;
  fee(token: any): Promsie<any>;

  on(name: string, cb: Function);
  off(name: string);
}

interface Utils {
  parseEther(eth: any): string;
  formatEther(wei: any, unit: string): string;
}

export const utils: Utils;
