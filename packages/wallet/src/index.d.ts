import BN from 'bn.js';

interface WalletOptions {
  key?: string;
  network?: string;
}

export class Wallet {
  public address: string;

  constructor(provider: any, options?: WalletOptions);

  _tokenId(token: string): Promise<BN>;
  balance(token: string, options?: any): Promise<BN>;
  deposit(token: string, amount: string, opts?: any): Promise<void>;
  transfer(token: string, recipient: string, amount: string): Promise<any>;
  faucet(): Promise<void>;
  _token(id: number): Promise<string>;

  sync(): void;
  withdraw(): Promise<any>;
  retrieve(): Promise<any>;
  fee(): Promsie<any>

  on(name: string, cb: Function);
  off(name: string);
}

interface Utils {
  parseEther(eth: string): string;
  formatEther(wei: string | BN, unit: string): string;
}

export const utils: Utils;
