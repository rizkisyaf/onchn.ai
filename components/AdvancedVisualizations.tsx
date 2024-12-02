import React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveNetwork } from '@nivo/network';
import { WalletData, Transaction } from '@/types/wallet';
import { DefaultHeatMapDatum } from '@nivo/heatmap';
import { HeatMapSerie } from '@nivo/heatmap';

interface AdvancedVisualizationsProps {
  walletData: WalletData[];
  transactions: Transaction[];
}

interface HeatMapData {
  id: string;
  data: DefaultHeatMapDatum[];
}

interface NetworkNode {
  id: string;
  size: number;
  color: string;
}

interface NetworkLink {
  source: string;
  target: string;
  value: number;
  distance: number;
  thickness?: number;
  color?: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export const AdvancedVisualizations: React.FC<AdvancedVisualizationsProps> = ({ walletData, transactions }) => {
  const heatmapData: HeatMapSerie<DefaultHeatMapDatum, { wallet: string }>[] = walletData.map((item) => ({
    id: item.wallet,
    wallet: item.wallet,
    data: [{ x: 'value', y: item.value }],
  }));

  const networkData: NetworkData = {
    nodes: walletData.map((item) => ({
      id: item.wallet,
      size: item.value,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    })),
    links: transactions.map((tx) => ({
      source: tx.source,
      target: tx.target,
      value: tx.value,
      distance: 100,
    })),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-[400px]">
        <ResponsiveHeatMap
          data={heatmapData}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.2s"
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: '',
            legendOffset: 46,
          }}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: '',
            legendOffset: 46,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Wallets',
            legendPosition: 'middle',
            legendOffset: -72,
          }}
          colors={{
            type: 'sequential',
            scheme: 'blues',
          }}
          emptyColor="#555555"
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              tickFormat: '>-.2s',
              title: 'Value →',
              titleAlign: 'start',
              titleOffset: 4,
            },
          ]}
        />
      </div>
      <div className="h-[400px]">
        <ResponsiveNetwork
          data={networkData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          linkDistance={(e) => e.distance}
          centeringStrength={0.3}
          repulsivity={6}
          nodeSize={(n) => n.size}
          nodeColor={(e) => e.color}
          linkThickness={(n) => 2 + 2 * (n as unknown as NetworkLink).value}
          activeNodeSize={(n) => 1.5 * n.size}
          inactiveNodeSize={(n) => n.size}
          nodeTooltip={({ node }) => (
            <div className="bg-white p-2 rounded shadow">
              <strong>{node.id}</strong>
              <br />
              Value: {node.size}
            </div>
          )}
        />
      </div>
    </div>
  );
};

