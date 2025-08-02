'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ChartProps {
  data: Array<{ label: string; value: number }>;
  type?: 'bar' | 'line';
  height?: number;
  color?: string;
}

export default function SimpleChart({ 
  data, 
  type = 'bar', 
  height = 200,
  color = '#f97316' 
}: ChartProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: height - 40 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: height - 40
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);
  
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const padding = { left: 50, right: 20, top: 20, bottom: 40 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;
  
  // Calculate positions
  const getX = (index: number) => {
    if (type === 'bar') {
      const barWidth = chartWidth / data.length;
      return padding.left + index * barWidth + barWidth / 2;
    }
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };
  
  const getY = (value: number) => {
    return padding.top + chartHeight - (value / maxValue) * chartHeight;
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: `${height}px`,
        position: 'relative'
      }}
    >
      {dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padding.top + chartHeight * (1 - fraction);
            return (
              <g key={fraction}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="rgba(249, 115, 22, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="12"
                >
                  {Math.round(maxValue * fraction)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="rgba(249, 115, 22, 0.3)"
            strokeWidth="2"
          />
          
          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="rgba(249, 115, 22, 0.3)"
            strokeWidth="2"
          />
          
          {type === 'bar' ? (
            // Bar chart
            data.map((item, index) => {
              const barWidth = chartWidth / data.length * 0.8;
              const x = getX(index) - barWidth / 2;
              const y = getY(item.value);
              const barHeight = padding.top + chartHeight - y;
              
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    opacity={0.8}
                    style={{
                      transition: 'all 0.3s ease-out',
                      cursor: 'pointer'
                    }}
                  />
                  <title>{`${item.label}: ${item.value}`}</title>
                </g>
              );
            })
          ) : (
            // Line chart
            <>
              {/* Line path */}
              <path
                d={data.map((item, index) => {
                  const x = getX(index);
                  const y = getY(item.value);
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Data points */}
              {data.map((item, index) => {
                const x = getX(index);
                const y = getY(item.value);
                return (
                  <g key={index}>
                    {/* Outer circle for better visibility */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                    />
                    {/* Inner circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill={color}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{`${item.label}: ${item.value}`}</title>
                    </circle>
                  </g>
                );
              })}
            </>
          )}
          
          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = getX(index);
            const showLabel = data.length <= 20 || index % Math.ceil(data.length / 20) === 0;
            
            return showLabel ? (
              <text
                key={index}
                x={x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
                transform={data.length > 10 ? `rotate(-45 ${x} ${padding.top + chartHeight + 20})` : ''}
              >
                {item.label}
              </text>
            ) : null;
          })}
        </svg>
      )}
    </div>
  );
}