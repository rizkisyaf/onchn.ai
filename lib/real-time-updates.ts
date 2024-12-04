import { getWalletInfo, getWalletData } from './api-client';

export class RealTimeUpdates {
  private pollingInterval: number;
  private walletAddress: string;
  private callback: (data: any) => void;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(walletAddress: string, callback: (data: any) => void, pollingInterval: number = 30000) {
    this.walletAddress = walletAddress;
    this.callback = callback;
    this.pollingInterval = pollingInterval;
  }

  start() {
    this.fetchData();
    this.intervalId = setInterval(() => this.fetchData(), this.pollingInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async fetchData() {
    try {
      const walletInfo = await getWalletInfo(this.walletAddress);
      const trades = await getWalletData(this.walletAddress);
      this.callback({ walletInfo, trades });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }
}

