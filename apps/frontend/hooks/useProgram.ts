import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/idl/mini_amm.json';
import { MiniAmm } from '@/types/mini_amm';
import { useMemo } from 'react';

const PROGRAM_ID = new PublicKey('7wDDaaWhgmFcA2RgY8m9DGECAHF2RWNAU8bDwfwz79xd');

export const useProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const provider =
    wallet &&
    new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

  // ctor order for @coral-xyz/anchor ≥ 0.30:  (idl, programId, provider)
  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as Idl, provider) as Program<MiniAmm>;
  }, [provider]);

  return program;           // you can also return { program, provider } if you need provider
};
