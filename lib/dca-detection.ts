import { PublicKey } from '@solana/web3.js';
import { getTransactionHistory } from './api-client';
import { WalletData } from './api-client';
import { DCAPattern } from '@/types/dca';
import { Connection } from '@solana/web3.js';

interface JupiterDCATransaction {
  signature: string;
  timestamp: number;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
}

interface DCAAccountData {
  remainingAmount: number;
  inputToken: PublicKey;
  outputToken: PublicKey;
  ordersLeft: number;
}

export async function getDCAPDA(walletAddress: string): Promise<DCAAccountData[]> {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
  const wallet = new PublicKey(walletAddress);
  const programId = new PublicKey('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB');

  const pdas = await connection.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: wallet.toBase58()
        }
      }
    ]
  });

  return pdas.map(pda => {
    // Decode account data based on Jupiter DCA program layout
    const data = pda.account.data;
    return {
      remainingAmount: Number(data.readBigUInt64LE(16)),
      inputToken: new PublicKey(data.slice(24, 56)),
      outputToken: new PublicKey(data.slice(56, 88)),
      ordersLeft: data.readUInt32LE(88)
    };
  });
}

export async function detectDCAPattern(address: string): Promise<DCAPattern[]> {
  const transactions = await getTransactionHistory(address);
  const jupiterDCAProgram = new PublicKey('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB');

  // Filter Jupiter DCA transactions
  const dcaTransactions = transactions.filter((tx: WalletData['transactions'][0]) =>
    tx.programId === jupiterDCAProgram.toBase58() &&
    tx.type === 'swap' &&
    tx.data?.startsWith('DCA')
  );

  // Convert to JupiterDCATransaction format
  const jupiterTxs: JupiterDCATransaction[] = dcaTransactions.map(tx => ({
    signature: tx.hash,
    timestamp: tx.timestamp,
    inputToken: tx.from,
    outputToken: tx.to,
    inputAmount: tx.amount,
    outputAmount: tx.value
  }));

  // Group transactions by input/output token pairs
  const groupedTransactions = groupDCATransactions(jupiterTxs);

  // Analyze patterns for each token pair
  const patterns: DCAPattern[] = [];

  for (const [tokenPair, txs] of groupedTransactions) {
    const [inputToken, outputToken] = tokenPair.split('-');

    // Sort by timestamp
    const sortedTxs = txs.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate frequency (time between orders)
    const frequencies = calculateFrequencies(sortedTxs);
    const avgFrequency = Math.round(frequencies.reduce((a, b) => a + b, 0) / frequencies.length);

    // Calculate amounts
    const avgAmount = calculateAverageAmount(sortedTxs);
    const totalAmount = sortedTxs.reduce((sum, tx) => sum + tx.inputAmount, 0);

    // Estimate remaining orders based on recent activity
    const remainingOrders = estimateRemainingOrders(sortedTxs);

    patterns.push({
      startDate: new Date(sortedTxs[0].timestamp * 1000),
      inputToken,
      outputToken,
      frequency: avgFrequency,
      totalAmount,
      amountPerOrder: avgAmount,
      remainingOrders,
      lastExecuted: new Date(sortedTxs[sortedTxs.length - 1].timestamp * 1000),
      nextExecution: calculateNextExecution(sortedTxs[sortedTxs.length - 1].timestamp, avgFrequency),
      averagePrice: calculateAveragePrice(sortedTxs)
    });
  }

  return patterns;
}

function groupDCATransactions(transactions: JupiterDCATransaction[]): Map<string, JupiterDCATransaction[]> {
  const groups = new Map<string, JupiterDCATransaction[]>();

  transactions.forEach(tx => {
    const tokenPair = `${tx.inputToken}-${tx.outputToken}`;
    if (!groups.has(tokenPair)) {
      groups.set(tokenPair, []);
    }
    groups.get(tokenPair)!.push(tx);
  });

  return groups;
}

function calculateFrequencies(transactions: JupiterDCATransaction[]): number[] {
  const frequencies: number[] = [];
  for (let i = 1; i < transactions.length; i++) {
    const timeDiff = transactions[i].timestamp - transactions[i - 1].timestamp;
    frequencies.push(Math.round(timeDiff / 60)); // Convert to minutes
  }
  return frequencies;
}

function calculateAverageAmount(transactions: JupiterDCATransaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.inputAmount, 0) / transactions.length;
}

function estimateRemainingOrders(transactions: JupiterDCATransaction[]): number {
  // Look at the last 3 transactions to estimate pattern continuation
  const recentTxs = transactions.slice(-3);
  const avgTimeBetween = calculateFrequencies(recentTxs)[0];
  const lastTxTime = recentTxs[recentTxs.length - 1].timestamp;
  const timeSinceLastTx = (Date.now() / 1000) - lastTxTime;

  // If time since last transaction is > 2x the average interval, assume DCA is complete
  if (timeSinceLastTx > avgTimeBetween * 120) { // 2 hours buffer
    return 0;
  }

  // Estimate based on recent transaction frequency
  return Math.ceil(5); // Default to 5 remaining orders if pattern is active
}

function calculateNextExecution(lastTimestamp: number, frequency: number): Date {
  return new Date((lastTimestamp + (frequency * 60)) * 1000);
}

function calculateAveragePrice(transactions: JupiterDCATransaction[]): number {
  const prices = transactions.map(tx => tx.outputAmount / tx.inputAmount);
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

