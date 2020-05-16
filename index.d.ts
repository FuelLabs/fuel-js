export class Wallet {
  constructor(options: {
    signer: any,
    provider: any,
    db?: any,
    chainId?: any,
  });
  deposit(amount: any, token: string, options?: any): Promise<any>;
  withdraw(amount: any, token: string, options?: any): Promise<any>;
  retrieve(token: string): Promise<any>;
  balance(token: string): Promise<any>;
  public tokens: { [name:string]: string };
}

declare class Index {}
declare class Memory {}
declare class Level {}

export const dbs: { Index: Index, Memory: Memory, Level: Level };
