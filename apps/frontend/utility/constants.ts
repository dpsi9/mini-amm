import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey('3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW');

// Pool and mint addresses
export const MINT_A = new PublicKey('M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7');
export const MINT_B = new PublicKey('BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5');
export const LP_MINT = new PublicKey('J5311AevFKg9bhkjsVsRSo3SiaFrri8W4LT4iBcgGTfJ');
export const POOL_PDA = new PublicKey('GHJVtqychC34xJi6Nn93SXxRoQNdmfysRgjr6NTub3N3');
export const TOKEN_A_VAULT = new PublicKey('Fw2Rd3My2HnowxdEg2Ey9hNTggHRPpyuTfr4UGnuSiyz');
export const TOKEN_B_VAULT = new PublicKey('7PQ4XKEXdnvRMhsPXNFjSv5QjWqDwuoHJQmbUTVwpNC7');

// Seeds for PDA derivation
export const SEED_POOL_ACCOUNT = Buffer.from("pool");
export const SEED_LP_MINT_ACCOUNT = Buffer.from("lp_mint");
export const SEED_VAULT_A_ACCOUNT = Buffer.from("vault_a");
export const SEED_VAULT_B_ACCOUNT = Buffer.from("vault_b");