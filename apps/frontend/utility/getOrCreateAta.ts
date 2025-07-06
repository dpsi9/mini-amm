import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const getOrCreateAta = async (
  wallet: PublicKey,
  mint: PublicKey,
  provider: AnchorProvider,
): Promise<{
  ata: PublicKey;
  ix?: TransactionInstruction;
}> => {
  const ata = await getAssociatedTokenAddress(
    mint,
    wallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const accountInfo = await provider.connection.getAccountInfo(ata);
  if (accountInfo) {
    return {
      ata,
    };
  }

  const ix = createAssociatedTokenAccountInstruction(
    wallet,
    ata,
    wallet,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return {
    ata,
    ix,
  };
};
