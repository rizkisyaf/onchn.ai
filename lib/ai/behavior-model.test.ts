import '@tensorflow/tfjs-node';
import { BehaviorModel } from './behavior-model';

interface WalletState {
  balance: number;
  price: number;
  volume: number;
  volatility: number;
  trend: number;
}

interface TrainingExample {
  state: WalletState;
  action: string;
  reward: number;
}

describe('BehaviorModel', () => {
  let model: BehaviorModel;

  beforeEach(() => {
    model = new BehaviorModel();
  });

  it('should predict trade actions', async () => {
    const state: WalletState = {
      balance: 100,
      price: 50,
      volume: 1000,
      volatility: 0.1,
      trend: 0.5,
    };

    const action = await model.predict(state);
    expect(action).toBeDefined();
    expect(['buy', 'sell', 'hold']).toContain(action);
  });

  it('should train on examples', async () => {
    const state: WalletState = {
      balance: 100,
      price: 50,
      volume: 1000,
      volatility: 0.1,
      trend: 0.5,
    };

    const action = await model.predict(state);
    const reward = action === 'buy' ? 1 : -1;
    await model.train(state, action, reward);

    const newAction = await model.predict(state);
    expect(newAction).toBeDefined();
  });

  it('should batch train on multiple examples', async () => {
    const examples: TrainingExample[] = [
      {
        state: {
          balance: 100,
          price: 50,
          volume: 1000,
          volatility: 0.1,
          trend: 0.5,
        },
        action: 'buy',
        reward: 1,
      },
      {
        state: {
          balance: 90,
          price: 55,
          volume: 1200,
          volatility: 0.15,
          trend: -0.2,
        },
        action: 'sell',
        reward: 0.5,
      },
    ];

    await model.batchTrain(examples);
    expect(model.isTraining).toBe(false);
  });
}); 