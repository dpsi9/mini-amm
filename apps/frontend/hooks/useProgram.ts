import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { MiniAmm } from '../types/mini_amm';
import idl from '../idl/mini_amm.json';

const PROGRAM_ID = new PublicKey('3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW');

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    
    return new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    
    return new Program(idl as Idl, provider) as Program<MiniAmm>;
  }, [provider]);

  return {
    program,
    provider,
    programId: PROGRAM_ID,
  };
}
