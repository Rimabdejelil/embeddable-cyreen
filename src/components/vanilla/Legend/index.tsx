import { Dimension } from '@embeddable.com/core';
import React from 'react';
import { DataResponse } from '@embeddable.com/core';

type Props = {
  IdStore?: Dimension;
  results: DataResponse;
  Monitoring?: boolean;
  MonStatus?: boolean;
};

const Legend: React.FC<Props> = ({ IdStore, results, Monitoring, MonStatus }) => {
  // Extract storeId from the first data row
  const storeId = results?.data?.[0]?.[IdStore?.name || 'id_store'];
  const isFerreroStore = Number(storeId) === 163;

  // Color definitions (matching the heatmap colors)
  const colors = isFerreroStore
    ? [
      { color: '#006400', label: 'Very Low' },  // dark green
      { color: '#93C572', label: 'Low' },      // pistache green
      { color: '#F4D03F', label: 'Medium' },   // yellow
      { color: '#FFA500', label: 'High' },     // orange
      { color: '#f04b55', label: 'Very High' } // red
    ]
    : [
      { color: '#006400', label: 'Low' },      // dark green
      { color: '#F4D03F', label: 'Medium' },   // yellow
      { color: '#f04b55', label: 'High' }      // red
    ];

  // Receipt status colors for Monitoring mode
  const receiptStatusColors = [
    { color: '#1e8f4dff', label: 'Receipts processed' },
    { color: '#F4D03F', label: 'Receipts available but not yet processed' },
    { color: '#e74c3c', label: 'Receipts not yet received' },
  ];

  const squareStyle = (color: string) => ({
    width: '14px',
    height: '14px',
    backgroundColor: color,
    marginRight: '8px',
    borderRadius: '2px',
  });

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%'
  };

  return (
    <div style={{
      height: Monitoring ? '180px' : '120px',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      minWidth: isFerreroStore ? '220px' : '160px'
    }}>
      <div style={{
        fontWeight: 'bold',
        marginBottom: '12px',
        color: '#495057',
        fontSize: '15px'
      }}>
        Legend
      </div>

      {Monitoring ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {receiptStatusColors.map((item, index) => (
            <div key={index} style={labelStyle}>
              <div style={squareStyle(item.color)} />
              {item.label}
            </div>
          ))}
        </div>
      ) : MonStatus ? (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {[
            { color: '#1e8f4dff', label: 'Online' },
            { color: '#1770abff', label: 'Closed' },
            { color: '#e74c3c', label: 'Offline' },
            { color: '#9E9E9E', label: 'Reconnecting' }
          ].map((item, index) => (
            <div key={index} style={{ ...labelStyle, width: '50%' }}>
              <div style={squareStyle(item.color)} />
              {item.label}
            </div>
          ))}
        </div>

      ) : isFerreroStore ? (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          height: '100%',
          alignContent: 'space-between'
        }}>
          {/* First column */}
          <div style={{ width: '50%' }}>
            <div style={labelStyle}>
              <div style={squareStyle(colors[0].color)} />
              {colors[0].label}
            </div>
            <div style={labelStyle}>
              <div style={squareStyle(colors[1].color)} />
              {colors[1].label}
            </div>
            <div style={labelStyle}>
              <div style={squareStyle(colors[2].color)} />
              {colors[2].label}
            </div>
          </div>

          {/* Second column */}
          <div style={{ width: '50%' }}>
            <div style={labelStyle}>
              <div style={squareStyle(colors[3].color)} />
              {colors[3].label}
            </div>
            <div style={labelStyle}>
              <div style={squareStyle(colors[4].color)} />
              {colors[4].label}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {colors.map((item, index) => (
            <div key={index} style={labelStyle}>
              <div style={squareStyle(item.color)} />
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Legend;