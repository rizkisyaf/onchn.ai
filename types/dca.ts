export interface DCAPattern {
  startDate: Date;
  inputToken: string;
  outputToken: string;
  frequency: number;
  totalAmount: number;
  amountPerOrder: number;
  remainingOrders: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  averagePrice?: number;
}

export interface DCAAnalysis {
  frequency: string;
  averageAmount: number;
  consistency: number;
  timePreference: string;
  successRate: number;
  unexecutedAmount: number;
} 