import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, Dimension, Measure } from '@embeddable.com/core';
import { DataResponse } from '@embeddable.com/core';
import Loading from '../util/Loading';
import Error from '../util/Error';
import * as d3 from 'd3';


type Props = {
    ds: Dataset;
    xMeasures: Measure[];
    yMeasures: Measure[];
    matrixValue: Dimension;
    results: DataResponse;
    xAxisTitle?: string;
    yAxisTitle?: string;
    MatrixKPIvalue: string;
};

// Function to format axis labels based on the provided rules
const formatAxisLabel = (value: number, index: number, ticks: { value: number }[], maxValue: number, minValue: number) => {
    // Skip label if the range is small

    // Determine formatting type
    let unit = '';
    let divisor = 1;

    if (maxValue >= 1_000_000_000) {
        unit = 'B';
        divisor = 1_000_000_000;
    } else if (maxValue >= 5_000_000) {
        unit = 'M';
        divisor = 1_000_000;
    } else if (maxValue > 5000) {
        unit = 'k';
        divisor = 1000;
    }

    // Format value
    const formatted = `${(value / divisor).toFixed(0)}${unit}`;

    // Avoid duplicate tick labels
    const prevTick = ticks[index - 1];
    const prevFormatted = prevTick !== undefined
        ? `${(prevTick.value / divisor).toFixed(0)}${unit}`
        : null;

    if (formatted === prevFormatted) {
        return '';
    }

    return formatted;
};

const MatrixChartECharts = ({ xMeasures, yMeasures, matrixValue, results, xAxisTitle, yAxisTitle, MatrixKPIvalue }: Props) => {
    const { isLoading, data, error } = results;
    const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number; z: string } | null>(null);

    if (isLoading) return <Loading />;
    if (error) return <Error msg={error} />;

    // Determine which yMeasure to use based on MatrixKPIvalue
    const yMeasure = MatrixKPIvalue === "Sales (Units)"
        ? yMeasures[0]
        : MatrixKPIvalue === "Revenue (CLP$)"
            ? yMeasures[1]
            : yMeasures[0]; // Default to first measure if not matched

    const xMeasure = MatrixKPIvalue === "Average Sales (Units)"
        ? xMeasures[0]
        : MatrixKPIvalue === "Average Revenue (CLP$)"
            ? xMeasures[1]
            : xMeasures[0]; // Default to first measure if not matched

    // Format data for ECharts
    const formattedData = data
        .map((d) => ({
            x: Number(d[xMeasure.name]),
            y: Number(d[yMeasure.name]),
            z: d[matrixValue.name],
        }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y));

    // Calculate min/max values for both axes
    const xValues = formattedData.map(d => d.x);
    const yValues = formattedData.map(d => d.y);
    const maxX = Math.max(...xValues);
    const minX = Math.min(...xValues);
    const maxY = Math.max(...yValues);
    const minY = Math.min(...yValues);

    // Define ECharts options
    const options = {
        title: {
            text: 'Matrix',
            left: 'left',
            textStyle: {
                color: '#a53241',
                fontSize: 23,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal'
            },
            top: 10,
            itemGap: 20
        },
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                const xValue = params.value[0];
                const yValue = params.value[1];
                const zValue = params.value[2];

                const formattedY = d3.format(',')(yValue);
                const formattedX = d3.format(',')(xValue);

                return (() => {
                    if (MatrixKPIvalue === "Average Sales (Units)" || MatrixKPIvalue === "Average Revenue (CLP$)") {
                        return `
    <div style="
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: black;
        white-space: nowrap;
    ">
        In the <span style="color: #a53241; font-weight: bold;">${zValue}</span> store, 
        <span style="color: #a53241; font-weight: bold;">${Math.round(yValue)}</span> minutes is the average in-store shopping duration<br>
        And the <span style="color: #a53241; font-weight: bold;">${MatrixKPIvalue}</span> at this store is 
        <span style="color: #a53241; font-weight: bold;">${xValue}</span>.
    </div>
`;
                    }
                    else {
                        return `
            <div style="
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: black;
                white-space: nowrap;
            ">
                <span style="color: #a53241; font-weight: bold;">${formattedX}</span> shoppers visited 
                <span style="color: #a53241; font-weight: bold;">${zValue}</span>, generating 
                <span style="color: #a53241; font-weight: bold;">${formattedY}</span> in ${MatrixKPIvalue}
            </div>
        `;
                    }
                })();

            },
            textStyle: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                color: 'black'
            },
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            padding: 10,
            extraCssText: 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 4px;'
        },

        xAxis: {
            type: 'value',
            name: xAxisTitle || xMeasure.title,
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: {
                color: 'black',
                fontFamily: 'Arial, sans-serif'
            },
            axisLine: {
                lineStyle: {
                    color: 'black'
                }
            },
            axisTick: {
                lineStyle: {
                    color: 'black'
                }
            },
            axisLabel: {
                formatter: (value: number, index: number) => formatAxisLabel(value, index, [], maxX, minX),
                margin: 10,
                color: 'black',
                fontFamily: 'Arial, sans-serif'
            },
            splitLine: {
                show: true
            }
        },
        yAxis: {
            type: 'value',
            name: yAxisTitle || yMeasure.title,
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                color: 'black',
                fontFamily: 'Arial, sans-serif'
            },
            axisLine: {
                lineStyle: {
                    color: 'black'
                }
            },
            axisTick: {
                lineStyle: {
                    color: 'black'
                }
            },
            axisLabel: {
                formatter: (value: number, index: number) => formatAxisLabel(value, index, [], maxY, minY),
                margin: 10,
                color: 'black',
                fontFamily: 'Arial, sans-serif'
            },
            nameRotate: 90,
            splitLine: {
                show: true
            }
        },
        series: [
            {
                name: 'Matrix Data',
                type: 'scatter',
                data: formattedData.map((d) => [d.x, d.y, d.z]),
                symbolSize: 10,
                itemStyle: {
                    color: '#f04b55'
                },
                emphasis: {
                    itemStyle: {
                        color: '#AF3241',
                        borderColor: '#fff',
                        borderWidth: 1
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: (params: any) => params.value[2],
                    color: 'black',
                    fontSize: 12,
                    fontFamily: 'Arial, sans-serif'
                },
            },
        ],
        grid: {
            left: '8%',
            right: '5%',
            top: '20%',
            bottom: '15%'
        },
        textStyle: {
            fontFamily: 'Arial, sans-serif'
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            padding: '15px',
            borderRadius: '15px',
            border: '1px solid #ccc'
        }}>
            <ReactECharts
                option={options}
                style={{ width: '100%', height: 400 }}
                onEvents={{
                    click: (params) => {
                        if (params.data) {
                            setSelectedPoint({ x: params.data[0], y: params.data[1], z: params.data[2] });
                        }
                    },
                }}
            />

            {selectedPoint && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                    <strong>Selected Matrix Value:</strong> {selectedPoint.z}
                </div>
            )}
        </div>
    );
};

export default MatrixChartECharts;