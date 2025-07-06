import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, SEED_LP_MINT_ACCOUNT } from "./constants";

export const getLpMintPda = (aMint: PublicKey, bMint: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [SEED_LP_MINT_ACCOUNT, aMint.toBuffer(), bMint.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};
