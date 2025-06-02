import React, { useState } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';

type Props = {
    title?: string;
    metrics?: Measure[];
    results: DataResponse;
    xAxis?: Dimension;
    KPIvalue?: string[];
    PercentageSign?: boolean;
};

export default ({ title, metrics, results, xAxis, KPIvalue, PercentageSign }: Props) => {
    const { isLoading, data, error } = results;
    const [showTooltip, setShowTooltip] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [containerWidth, setContainerWidth] = useState(0);

    //const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const firstResult = data?.[1];
    let hourGroup = firstResult?.[xAxis?.name] || "No hour group available";

    //if (xAxis?.name === "big_dm.weekday") {
      //  hourGroup = weekdayNames[hourGroup - 1] || "Invalid day";
//    }

    let selectedMetrics: Measure[] = [];

    if (KPIvalue?.includes('Conversion Rate')) {
        selectedMetrics = metrics?.filter(metric => metric.name.includes('conversion_rate')) || [];
    } else if (KPIvalue?.includes('Conversion Difference')) {
        selectedMetrics = metrics?.filter(metric => metric.name.includes('conversion_difference')) || [];
    } else if (KPIvalue?.includes('Sales Uplift')) {
        selectedMetrics = metrics?.filter(metric => metric.name.includes('sales_uplift')) || [];
    } else if (KPIvalue?.includes('Conversion Uplift')) {
        selectedMetrics = metrics?.filter(metric => metric.name.includes('conversion_uplift')) || [];
    }

    let highestKpiValue = -Infinity;
    let highestKpiHourGroup = "No hour group available";

    selectedMetrics.forEach(metric => {
        data?.forEach(result => {
            const kpiValue = Number(result[metric.name]);
            if (kpiValue > highestKpiValue) {
                highestKpiValue = kpiValue;
                highestKpiHourGroup = result[xAxis?.name] || "No hour group available";
            }
        });
    });

   // if (xAxis?.name === "big_dm.weekday") {
      //  highestKpiHourGroup = weekdayNames[highestKpiHourGroup - 1] || "Invalid day";
    //}

    let formattedKpiValue = "N/A";

    if (highestKpiValue !== -Infinity) {
        if (KPIvalue?.includes('Conversion Uplift')) {
            formattedKpiValue = Math.round(highestKpiValue).toString();
        } else {
            formattedKpiValue = highestKpiValue.toFixed(2);
        }
        formattedKpiValue += '%';
    }

    let metricTitle = '';
    if (KPIvalue?.includes('Conversion Rate')) {
        metricTitle = 'Conversion With C.A.P.';
    } else if (KPIvalue?.includes('Conversion Difference')) {
        metricTitle = metrics?.[1]?.title || '';
    } else if (KPIvalue?.includes('Sales Uplift')) {
        metricTitle = metrics?.[2]?.title || '';
    } else if (KPIvalue?.includes('Conversion Uplift')) {
        metricTitle = metrics?.[3]?.title || '';
    }

    const tooltipContentJSX = selectedMetrics.map((metric, idx) => {
        const sortedData = data
            ?.map(result => {
                let xAxisValue = result[xAxis?.name] || 'N/A';
               // if (xAxis?.name === "big_dm.weekday") {
                 //   xAxisValue = weekdayNames[xAxisValue - 1] || "Invalid day";
                //}
                const metricValue = Number(result[metric.name]);
                return { xAxisValue, metricValue };
            })
            .sort((a, b) => b.metricValue - a.metricValue);

        return (
            <div key={metric.name} style={{ marginBottom: idx !== selectedMetrics.length - 1 ? '10px' : '0' }}>
                <div>
                    {sortedData?.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: item.metricValue === highestKpiValue ? '#a53241' : '#555',
                            fontWeight: item.metricValue === highestKpiValue ? 'bold' : 'normal',
                            padding: '2px 0'
                        }}>
                            <span style={{ marginRight: '15px' }}>{item.xAxisValue}</span>
                            <span>
                                {KPIvalue?.includes('Conversion Uplift')
                                    ? Math.round(item.metricValue)
                                    : item.metricValue.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
                {idx !== selectedMetrics.length - 1 && (
                    <div style={{
                        height: '1px',
                        background: 'linear-gradient(to right, #eee, #ccc, #eee)',
                        marginTop: '10px'
                    }} />
                )}
            </div>
        );
    });

    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            height: '100%'
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
                color: '#a53241',
                fontSize: '23px',
                fontFamily: 'Arial, sans-serif',
                marginTop: '10px',
                marginBottom: '25px',
            }}>
                Best {xAxis?.title}
            </h2>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#333942',
                    position: 'relative'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {highestKpiHourGroup}
                    <span style={{
                        fontSize: '12px',
                        color: '#888',
                        marginLeft: '5px',
                        verticalAlign: 'super',
                    }}>
                        Highest
                    </span>
                </div>

                <div>{formattedKpiValue}</div>

                {showTooltip && (
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