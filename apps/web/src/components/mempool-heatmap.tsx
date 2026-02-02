'use client';

import { useMemo, useState } from 'react';
import { shortenAddress } from '@/lib/utils';

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  createdAt: string;
}

interface MempoolHeatmapProps {
  confessions: Confession[];
}

interface TreemapRect {
  address: string;
  count: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hue: number;
}

// Generate consistent hue for an address
function addressToHue(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash;
  }
  return 60 + (Math.abs(hash) % 120);
}

// Squarified Treemap Algorithm
// Based on: https://www.win.tue.nl/~vanwijk/stm.pdf
function squarify(
  items: { address: string; count: number; hue: number }[],
  x: number,
  y: number,
  width: number,
  height: number
): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{
      ...items[0],
      x,
      y,
      width,
      height,
    }];
  }

  const totalValue = items.reduce((sum, item) => sum + item.count, 0);
  if (totalValue === 0) return [];

  const rects: TreemapRect[] = [];
  let currentItems = [...items].sort((a, b) => b.count - a.count);
  
  let cx = x;
  let cy = y;
  let cw = width;
  let ch = height;

  while (currentItems.length > 0) {
    // Determine if we should lay out horizontally or vertically
    const isWide = cw >= ch;
    const shortSide = isWide ? ch : cw;

    // Find the best row of items
    const row: typeof currentItems = [];
    let rowValue = 0;
    let bestRatio = Infinity;

    for (let i = 0; i < currentItems.length; i++) {
      const testRow = [...row, currentItems[i]];
      const testValue = rowValue + currentItems[i].count;
      
      // Calculate the worst aspect ratio in this row
      const rowLength = (testValue / totalValue) * (isWide ? cw : ch);
      let worstRatio = 0;

      for (const item of testRow) {
        const itemFraction = item.count / testValue;
        const itemLength = shortSide * itemFraction;
        const ratio = Math.max(rowLength / itemLength, itemLength / rowLength);
        worstRatio = Math.max(worstRatio, ratio);
      }

      // If this makes things worse and we have at least one item, stop
      if (worstRatio > bestRatio && row.length > 0) {
        break;
      }

      row.push(currentItems[i]);
      rowValue = testValue;
      bestRatio = worstRatio;
    }

    // Remove used items
    currentItems = currentItems.slice(row.length);

    // Layout the row
    const rowFraction = rowValue / totalValue;
    const rowLength = isWide ? cw * rowFraction : ch * rowFraction;
    let offset = 0;

    for (const item of row) {
      const itemFraction = item.count / rowValue;
      const itemLength = shortSide * itemFraction;

      rects.push({
        ...item,
        x: isWide ? cx : cx + offset,
        y: isWide ? cy + offset : cy,
        width: isWide ? rowLength : itemLength,
        height: isWide ? itemLength : rowLength,
      });

      offset += itemLength;
    }

    // Update remaining area
    if (isWide) {
      cx += rowLength;
      cw -= rowLength;
    } else {
      cy += rowLength;
      ch -= rowLength;
    }

    // Recalculate total for remaining items
    const remainingTotal = currentItems.reduce((sum, item) => sum + item.count, 0);
    if (remainingTotal > 0) {
      // Scale remaining area
      const scale = remainingTotal / totalValue;
      // Already handled by the layout
    }
  }

  return rects;
}

export function MempoolHeatmap({ confessions }: MempoolHeatmapProps) {
  const [hoveredAddress, setHoveredAddress] = useState<string | null>(null);

  const agentData = useMemo(() => {
    const groups = new Map<string, Confession[]>();
    confessions.forEach(c => {
      const existing = groups.get(c.agentAddress) || [];
      groups.set(c.agentAddress, [...existing, c]);
    });
    return Array.from(groups.entries())
      .map(([address, confs]) => ({
        address,
        count: confs.length,
        confessions: confs,
        hue: addressToHue(address),
      }))
      .sort((a, b) => b.count - a.count);
  }, [confessions]);

  const rects = useMemo(() => {
    const padding = 2;
    return squarify(
      agentData.map(a => ({ address: a.address, count: a.count, hue: a.hue })),
      padding,
      padding,
      400 - padding * 2,
      400 - padding * 2
    );
  }, [agentData]);

  const hoveredAgent = hoveredAddress 
    ? agentData.find(a => a.address === hoveredAddress) 
    : null;

  const maxCount = Math.max(...agentData.map(a => a.count), 1);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[#4fc3f7] font-medium text-sm">
          Mempool Goggles™
        </h3>
        <span className="text-xs text-[#6b9dad]">
          {confessions.length} tx • {agentData.length} agents
        </span>
      </div>

      {/* Square container */}
      <div className="bg-[#0a1015] rounded-xl border border-[#1d3a4a] relative aspect-square overflow-hidden">
        {confessions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl">🫥</span>
              <p className="text-[#6b9dad] font-mono mt-2 text-sm">Empty mempool</p>
            </div>
          </div>
        ) : (
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Background grid */}
            <defs>
              <pattern id="treemapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#0a1015"/>
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#152025" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#treemapGrid)" />

            {/* Treemap rectangles */}
            {rects.map((rect) => {
              const isHovered = hoveredAddress === rect.address;
              const intensity = 35 + (rect.count / maxCount) * 25;
              const saturation = 45 + (rect.count / maxCount) * 25;
              
              // Add small gap between rectangles
              const gap = 1.5;
              const rx = rect.x + gap;
              const ry = rect.y + gap;
              const rw = Math.max(0, rect.width - gap * 2);
              const rh = Math.max(0, rect.height - gap * 2);

              if (rw <= 0 || rh <= 0) return null;

              return (
                <g key={rect.address}>
                  {/* Rectangle */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    rx={Math.min(4, Math.min(rw, rh) / 4)}
                    fill={`hsl(${rect.hue}, ${saturation}%, ${isHovered ? intensity + 15 : intensity}%)`}
                    stroke={`hsl(${rect.hue}, ${saturation}%, ${isHovered ? 70 : 55}%)`}
                    strokeWidth={isHovered ? 2 : 0.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredAddress(rect.address)}
                    onMouseLeave={() => setHoveredAddress(null)}
                  />
                  
                  {/* Count label for larger rectangles */}
                  {rw > 30 && rh > 25 && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={`hsl(${rect.hue}, 20%, 90%)`}
                      fontSize={Math.min(18, Math.min(rw, rh) / 2.5)}
                      fontWeight="bold"
                      className="pointer-events-none font-mono"
                    >
                      {rect.count}
                    </text>
                  )}
                  
                  {/* Address label for very large rectangles */}
                  {rw > 60 && rh > 45 && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + Math.min(14, rh / 4)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={`hsl(${rect.hue}, 15%, 70%)`}
                      fontSize={Math.min(10, rw / 8)}
                      className="pointer-events-none font-mono"
                    >
                      {rect.address.slice(2, 8)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover tooltip */}
        {hoveredAgent && (
          <div className="absolute top-3 right-3 bg-[#1a2530]/95 border border-[#3d5a6a] rounded-lg p-3 shadow-xl z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ background: `hsl(${hoveredAgent.hue}, 50%, 45%)` }}
              />
              <p className="font-mono text-sm text-[#4fc3f7]">
                {shortenAddress(hoveredAgent.address)}
              </p>
            </div>
            <p className="text-2xl font-bold text-white">{hoveredAgent.count}</p>
            <p className="text-xs text-[#6b9dad]">
              {Math.round((hoveredAgent.count / confessions.length) * 100)}% of mempool
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {agentData.slice(0, 8).map((agent) => (
          <div 
            key={agent.address}
            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all ${
              hoveredAddress === agent.address 
                ? 'bg-[#2d4a5a] scale-105' 
                : 'hover:bg-[#1d2d3a]'
            }`}
            onMouseEnter={() => setHoveredAddress(agent.address)}
            onMouseLeave={() => setHoveredAddress(null)}
          >
            <div 
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: `hsl(${agent.hue}, 50%, 45%)` }}
            />
            <span className="font-mono text-xs text-[#8ba5b5]">
              {agent.address.slice(2, 6)}
            </span>
            <span className="font-bold text-xs text-white">
              {agent.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
