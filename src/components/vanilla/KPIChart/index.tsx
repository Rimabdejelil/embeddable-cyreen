import React from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';

type Props = {
    title?: string;
    metrics?: Measure[]; // Accepts multiple KPIs
    results: DataResponse;
};

export default ({ title, metrics, results }: Props) => {
    const { isLoading, data, error } = results;

    // Extract first and second KPI values
    const firstKPI = metrics?.[0];
    const secondKPI = metrics?.[1];

    const firstValue = firstKPI ? (data?.[0]?.[firstKPI.name] ?? 'No data') : null;
    const secondValue = secondKPI ? (data?.[0]?.[secondKPI.name] ?? 'No data') : null;

    // Format first KPI as a number with commas (e.g., 168654 -> 168,654)
    const formattedFirstValue = firstValue && !isNaN(firstValue)
        ? parseFloat(firstValue).toLocaleString("en-US")  // Adds commas for thousands
        : 'No data';

    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
        }}>
            {/* Title */}
            {title && (
                <h2 style={{
                    color: '#a53241', // Title color updated to Bordeaux Red
                    fontSize: '23px',
                    fontFamily: 'Arial, sans-serif',
                }}>
                    {title}
                </h2>
            )}

            {/* KPI Display */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* First KPI (Top) */}
                <div style={{
                    fontSize: '36px', // A bit bigger
                    fontWeight: 'bold',
                    color: '#333942' // Dark black color for number
                }}>
                    {formattedFirstValue}
                </div>

                {/* Second KPI (Bottom Right) */}
                {secondValue && (
                    <div style={{
                        fontSize: '20px',
                        color: 'green',
                        fontWeight: 'bold',
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px'
                    }}>
                        {secondValue}
                    </div>
                )}
            </div>
        </div>
    );
};
