import * as tf from '@tensorflow/tfjs';
import { WalletData } from '@/types/wallet';

export class WalletBehaviorModel {
  private model: tf.Sequential;

  constructor() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
  }

  async train(data: WalletData[], labels: number[]) {
    const xs = tf.tensor2d(data.map(d => [
      d.balance,
      d.transactions.length,
      d.avgTransactionValue,
      d.totalInflow,
      d.totalOutflow,
      d.uniqueInteractions,
      d.dcaFrequency,
      d.avgDcaAmount,
      d.winRate,
      d.pnl
    ]));
    const ys = tf.tensor2d(labels.map(l => [l]));

    await this.model.fit(xs, ys, {
      epochs: 100,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
        }
      }
    });
  }

  predict(walletData: WalletData): number {
    const input = tf.tensor2d([[
      walletData.balance,
      walletData.transactions.length,
      walletData.avgTransactionValue,
      walletData.totalInflow,
      walletData.totalOutflow,
      walletData.uniqueInteractions,
      walletData.dcaFrequency,
      walletData.avgDcaAmount,
      walletData.winRate,
      walletData.pnl
    ]]);
    const prediction = this.model.predict(input) as tf.Tensor;
    return prediction.dataSync()[0];
  }
}

export const walletBehaviorModel = new WalletBehaviorModel();

