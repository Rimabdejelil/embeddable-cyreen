import React, { useState, useRef } from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';
import DownloadMenu from '../DownloadMenu';

type Props = {
    title?: string;
    metrics?: Measure[]; // Accepts multiple KPIs
    results: DataResponse;
    enableDownloadAsCSV?: boolean;
    enableDownloadAsPNG?: boolean;
    Despar?: boolean;
};

export default (props: Props) => {
    const {
        title, metrics, results,
        enableDownloadAsCSV,
        enableDownloadAsPNG, Despar
    } = props;
    const { isLoading, data, error } = results;

    // Extract first and second KPI values
    const firstKPI = metrics?.[0];
    const secondKPI = metrics?.[1];

    const firstValue = firstKPI ? (data?.[0]?.[firstKPI.name] ?? 'No data') : null;
    const secondValue = secondKPI ? (data?.[0]?.[secondKPI.name] ?? 'No data') : null;

    const chartRef = useRef<HTMLDivElement>(null);
    const [preppingDownload, setPreppingDownload] = useState(false);
    const [isOverDownloadMenu, setIsOverDownloadMenu] = useState(false);
    function formatNumber(value: number | string | null, despar?: boolean): string {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return 'No data';
        }
        const num = Number(value);
        if (despar) {
            // Use US format then replace commas with dots
            return num.toLocaleString('en-US').replace(/,/g, '.');
        } else {
            return num.toLocaleString('en-US');
        }
    }


    // Format first KPI as a number with commas (e.g., 168654 -> 168,654)
    const formattedFirstValue = formatNumber(firstValue, Despar);




    return (
        <div
            ref={chartRef}
            style={{
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                height: '100%'
            }}>

            {/* Download Menu - with mouse event handlers */}
            {(enableDownloadAsCSV || enableDownloadAsPNG) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        fontSize: '14px',
                        zIndex: 1000,
                        backgroundColor: 'transparent',
                        padding: 0,
                        margin: 0,
                        border: 'none',
                        outline: 'none'
                    }}
                    onMouseEnter={() => setIsOverDownloadMenu(true)}
                    onMouseLeave={() => setIsOverDownloadMenu(false)}
                >
                    <DownloadMenu
                        csvOpts={{
                            chartName: props.title || 'chart',
                            props: {
                                ...props,
                                results: results,
                            },
                        }}
                        enableDownloadAsCSV={enableDownloadAsCSV}
                        enableDownloadAsPNG={enableDownloadAsPNG}
                        pngOpts={{ chartName: props.title || 'chart', element: chartRef.current }}
                        preppingDownload={preppingDownload}
                        setPreppingDownload={setPreppingDownload}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: 0,
                            margin: 0
                        }}
                    />
                </div>
            )}

            {/* Title */}
            {title && (
                <h2 style={{
                    color: '#a53241',
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
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#333942'
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