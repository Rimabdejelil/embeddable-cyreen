import React, { useState } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';

type Props = {
    title?: string;
    metrics?: Measure[];
    results: DataResponse;
    xAxis?: Dimension;
    PercentageSign?: boolean;
};

export default ({ title, metrics, results, xAxis, PercentageSign }: Props) => {
    const { isLoading, data, error } = results;
    const [showTooltip, setShowTooltip] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [containerWidth, setContainerWidth] = useState(0);

    const firstMetric = metrics?.[0];
    const firstResult = data?.[1];
    let hourGroup = firstResult?.[xAxis?.name] || "No KPI available";

    let highestKpiValue = -Infinity;
    let highestKpiHourGroup = "No KPI available";

    if (firstMetric) {
        data?.forEach(result => {
            const kpiValue = Number(result[firstMetric.name]);
            if (kpiValue > highestKpiValue) {
                highestKpiValue = kpiValue;
                highestKpiHourGroup = result[xAxis?.name] || "No KPI available";
            }
        });
    }

    let formattedKpiValue = "N/A";
    if (highestKpiValue !== -Infinity) {
        formattedKpiValue = Number.isFinite(highestKpiValue)
            ? `${Math.round(highestKpiValue)} minutes`
            : 'No data';
    }

    const tooltipContentJSX = firstMetric ? (
        <div>
            {data
                ?.map(result => {
                    let xAxisValue = result[xAxis?.name] || 'N/A';
                    const metricValue = Number(result[firstMetric.name]);
                    return { xAxisValue, metricValue };
                })
                .sort((a, b) => b.metricValue - a.metricValue)
                .map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: item.metricValue === highestKpiValue ? '#a53241' : '#555',
                        fontWeight: item.metricValue === highestKpiValue ? 'bold' : 'normal',
                        padding: '2px 0'
                    }}>
                        <span style={{ marginRight: '15px' }}>{item.xAxisValue}</span>
                        <span>{Number.isInteger(item.metricValue) ? item.metricValue : item.metricValue.toFixed(0)} minutes{PercentageSign ? '%' : ''}</span>
                    </div>
                ))}
        </div>
    ) : null;

    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            height: '100%',
            backgroundColor: '#AF3241'
        }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }}
            ref={(el) => {
                if (el) {
                    const { width } = el.getBoundingClientRect();
                    setContainerWidth(width);
                }
            }}>
            <h2 style={{
                color: 'white',
                fontSize: '23px',
                fontFamily: 'Arial, sans-serif',
                marginTop: '10px',
                marginBottom: '25px',
            }}>
                {title}
            </h2>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
                color: 'white',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '4px' }}>In </span> {highestKpiHourGroup}
                </div>

                <div>
                    <span style={{ fontSize: '20px', marginRight: '4px' }}>with</span> {formattedKpiValue}
                </div>

                {showTooltip && tooltipContentJSX && (
                    <div style={{
                        position: 'absolute',
                        top: `${mousePos.y - 30}px`,
                        left: `${Math.min(mousePos.x - 30, containerWidth - 170)}px`,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        borderRadius: '6px',
                        zIndex: 10,
                        width: 'max-content',
                        maxWidth: '300px',
                        pointerEvents: 'none',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '12px',
                        color: '#333'
                    }}>
                        {tooltipContentJSX}
                    </div>
                )}
            </div>
        </div>
    );
};
