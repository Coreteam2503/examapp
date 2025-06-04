import React, { useState } from 'react';
import './SimpleChart.css';

const SimpleChart = ({ 
  data, 
  type = 'line', 
  color = '#3b82f6', 
  height = 200, 
  showGrid = false, 
  showTooltip = false 
}) => {
  const [tooltip, setTooltip] = useState(null);

  if (!data || data.length === 0) {
    return <div className="chart-no-data">No data available</div>;
  }

  const width = 800;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate data bounds
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Helper functions
  const getX = (index) => padding + (index / (data.length - 1)) * chartWidth;
  const getY = (value) => padding + chartHeight - ((value - minValue) / range) * chartHeight;

  // Generate SVG path for line chart
  const generateLinePath = () => {
    if (data.length === 0) return '';
    
    let path = `M ${getX(0)} ${getY(data[0].value)}`;
    for (let i = 1; i < data.length; i++) {
      path += ` L ${getX(i)} ${getY(data[i].value)}`;
    }
    return path;
  };

  // Generate area path
  const generateAreaPath = () => {
    if (data.length === 0) return '';
    
    let path = `M ${getX(0)} ${getY(data[0].value)}`;
    for (let i = 1; i < data.length; i++) {
      path += ` L ${getX(i)} ${getY(data[i].value)}`;
    }
    // Close the path at the bottom
    path += ` L ${getX(data.length - 1)} ${padding + chartHeight}`;
    path += ` L ${getX(0)} ${padding + chartHeight}`;
    path += ' Z';
    return path;
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const gridLines = 5;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (i / gridLines) * chartHeight;
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={padding + chartWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }
    
    // Vertical grid lines
    const verticalLines = Math.min(data.length - 1, 10);
    for (let i = 0; i <= verticalLines; i++) {
      const x = padding + (i / verticalLines) * chartWidth;
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={padding + chartHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }
    
    return lines;
  };

  const handleMouseMove = (event, dataPoint, index) => {
    if (!showTooltip) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      data: dataPoint,
      index
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="simple-chart" style={{ position: 'relative' }}>
      <svg width={width} height={height} className="chart-svg">
        {/* Grid */}
        {showGrid && generateGridLines()}
        
        {/* Area fill for line charts */}
        {type === 'line' && (
          <path
            d={generateAreaPath()}
            fill={color}
            fillOpacity="0.1"
          />
        )}
        
        {/* Main chart */}
        {type === 'line' && (
          <path
            d={generateLinePath()}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {type === 'bar' && data.map((dataPoint, index) => {
          const barWidth = chartWidth / data.length * 0.8;
          const barHeight = ((dataPoint.value - minValue) / range) * chartHeight;
          const x = getX(index) - barWidth / 2;
          const y = getY(dataPoint.value);
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="4"
            />
          );
        })}
        
        {/* Data points */}
        {type === 'line' && data.map((dataPoint, index) => (
          <circle
            key={index}
            cx={getX(index)}
            cy={getY(dataPoint.value)}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="chart-point"
            onMouseMove={(e) => handleMouseMove(e, dataPoint, index)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        
        {/* Interactive areas for tooltips */}
        {showTooltip && data.map((dataPoint, index) => (
          <rect
            key={`interactive-${index}`}
            x={getX(index) - 20}
            y={padding}
            width="40"
            height={chartHeight}
            fill="transparent"
            onMouseMove={(e) => handleMouseMove(e, dataPoint, index)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        
        {/* Axes */}
        <line
          x1={padding}
          y1={padding + chartHeight}
          x2={padding + chartWidth}
          y2={padding + chartHeight}
          stroke="#6b7280"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke="#6b7280"
          strokeWidth="1"
        />
      </svg>
      
      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10
          }}
        >
          <div className="tooltip-date">{tooltip.data.date}</div>
          <div className="tooltip-value">{tooltip.data.value}</div>
        </div>
      )}
    </div>
  );
};

export default SimpleChart;