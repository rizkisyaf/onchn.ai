import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WalletGraph from './components/WalletGraph';

interface WalletData {
  address: string;
  balance: number;
  transactions: string[];
}

function App() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [address, setAddress] = useState('');
  const [graphData, setGraphData] = useState({
    nodes: [{ id: 'main' }],
    links: []
  });

  const fetchWalletData = async () => {
    try {
      const response = await axios.get(`/api/wallet/${address}`);
      setWalletData(response.data);
      
      // Update graph data
      setGraphData({
        nodes: [
          { id: 'main' },
          ...response.data.transactions.map((tx: string) => ({ id: tx }))
        ],
        links: response.data.transactions.map((tx: string) => ({ source: 'main', target: tx }))
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Solana Wallet Forensics</h1>
      <div className="mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter wallet address"
          className="border p-2 mr-2"
        />
        <button onClick={fetchWalletData} className="bg-blue-500 text-white p-2 rounded">
          Fetch Data
        </button>
      </div>
      {walletData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Wallet Data</h2>
          <p>Address: {walletData.address}</p>
          <p>Balance: {walletData.balance} SOL</p>
          <h3 className="text-lg font-semibold mt-2">Transactions:</h3>
          <ul>
            {walletData.transactions.map((tx, index) => (
              <li key={index}>{tx}</li>
            ))}
          </ul>
          <h3 className="text-lg font-semibold mt-4">Wallet Graph</h3>
          <WalletGraph data={graphData} />
        </div>
      )}
    </div>
  );
}

export default App;

