import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '@/hooks/use-resize-observer';

interface WalletGraphProps {
  data: {
    nodes: { id: string }[];
    links: { source: string; target: string }[];
  };
}

const WalletGraph: React.FC<WalletGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dimensions = useResizeObserver(wrapperRef);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const initializeGraph = useCallback(() => {
    if (!svgRef.current || !dimensions) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    // Clear previous graph
    svg.selectAll("*").remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    const g = svg.append('g');

    // Create forces
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d: any) => d.id === 'main' ? 15 : 8)
      .attr('fill', (d: any) => d.id === 'main' ? '#4f46e5' : '#9ca3af')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text((d: any) => d.id === 'main' ? 'Wallet' : d.id.slice(0, 6) + '...')
      .attr('x', (d: any) => d.id === 'main' ? 20 : 12)
      .attr('y', 4)
      .attr('font-size', (d: any) => d.id === 'main' ? '14px' : '12px')
      .attr('fill', '#4b5563');

    // Add hover effects
    node
      .on('mouseover', function(event, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.id === 'main' ? 18 : 10);
        
        setSelectedNode(d.id);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.id === 'main' ? 15 : 8);
        
        setSelectedNode(null);
      });

    // Add simulation tick function
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="glow" height="300%" width="300%" x="-75%" y="-75%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      {selectedNode && (
        <div className="absolute bg-white p-2 rounded shadow-lg text-sm">
          {selectedNode === 'main' ? 'Main Wallet' : selectedNode}
        </div>
      )}
    </div>
  );
};

export default WalletGraph;

