import * as tf from '@tensorflow/tfjs';

export class ReinforcementLearningModel {
  private model: tf.Sequential;

  constructor(inputShape: number, outputShape: number) {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [inputShape], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: outputShape, activation: 'softmax' })
      ]
    });

    this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  }

  async train(states: number[][], actions: number[], rewards: number[], nextStates: number[][]) {
    const stateTensor = tf.tensor2d(states);
    const nextStateTensor = tf.tensor2d(nextStates);
    const actionTensor = tf.tensor1d(actions, 'int32');
    const rewardTensor = tf.tensor1d(rewards);

    const qValues = this.model.predict(stateTensor) as tf.Tensor;
    const nextQValues = this.model.predict(nextStateTensor) as tf.Tensor;

    const targetQValues = qValues.clone();
    const nextQValuesMax = nextQValues.max(1);

    const targetMask = tf.oneHot(actionTensor, qValues.shape[1]);
    const targetValues = rewardTensor.add(nextQValuesMax.mul(0.99));
    targetQValues.mul(targetMask.logicalNot()).add(targetValues.mul(targetMask));

    await this.model.fit(stateTensor, targetQValues, {
      epochs: 1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
        }
      }
    });

    tf.dispose([stateTensor, nextStateTensor, actionTensor, rewardTensor, qValues, nextQValues, targetQValues, nextQValuesMax, targetMask, targetValues]);
  }

  predict(state: number[]): number {
    const stateTensor = tf.tensor2d([state]);
    const prediction = this.model.predict(stateTensor) as tf.Tensor;
    const action = prediction.argMax(1).dataSync()[0];
    tf.dispose([stateTensor, prediction]);
    return action;
  }
}

export const rlModel = new ReinforcementLearningModel(10, 3); // Assuming 10 input features and 3 possible actions

