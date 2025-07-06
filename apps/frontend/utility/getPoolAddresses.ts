import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

import { SEED_POOL_ACCOUNT, SEED_VAULT_A_ACCOUNT, SEED_VAULT_B_ACCOUNT } from "@/utility/constants";

export const getPoolAddresses = async (lpMint: PublicKey) => {
  const [poolPda] = await PublicKey.findProgramAddressSync(
    [SEED_POOL_ACCOUNT, lpMint.toBuffer()],
    PROGRAM_ID,
  );

  const [vaultAPda] = await PublicKey.findProgramAddressSync(
    [SEED_VAULT_A_ACCOUNT, lpMint.toBuffer()],
    PROGRAM_ID,
  );

  const [vaultBPda] = await PublicKey.findProgramAddressSync(
    [SEED_VAULT_B_ACCOUNT, lpMint.toBuffer()],
    PROGRAM_ID,
  );

  return {
    poolPda,
    vaultAPda,
    vaultBPda,
  };
};
