import { Connection, PublicKey } from '@solana/web3.js';
import { JupiterClient } from '@/lib/trading/jupiter-client';

const PLATFORM_FEE_BPS = 200 // 2% fee
const REFERRAL_ACCOUNT = new PublicKey("FMeQzCuuqWvqFHEbvqJbdZBJa4fqbmwBjDbLKPBuyTjF")

export async function performSwap(
  connection: Connection,
  userPublicKey: PublicKey,
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  slippage: number
) {
  const [feeAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("referral_ata"),
      REFERRAL_ACCOUNT.toBuffer(),
      inputMint.toBuffer()
    ],
    new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3")
  );

  const jupiter = new JupiterClient(connection, userPublicKey, {
    platformFeeBps: PLATFORM_FEE_BPS,
    feeAccount: feeAccount.toString()
  });
  
  await jupiter.init();

  const routes = await jupiter.getRoutes({
    inputMint: inputMint.toBase58(),
    outputMint: outputMint.toBase58(),
    amount,
    slippage,
  });

  const bestRoute = routes[0];

  if (!bestRoute) {
    throw new Error('No route found');
  }

  const swapResult = await jupiter.executeSwap(bestRoute);
  return swapResult;
}

