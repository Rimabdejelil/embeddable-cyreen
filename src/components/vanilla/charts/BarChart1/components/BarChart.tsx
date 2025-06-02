import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import {
    BarElement,
    CategoryScale,
    ChartData,
    Chart as ChartJS,
    Filler,
    Legend,
    PointElement,
    LineElement,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React from 'react';
import { Chart } from 'react-chartjs-2';

import {
    COLORS,
    DATE_DISPLAY_FORMATS,
    EMB_FONT,
    LIGHT_FONT,
    SMALL_FONT_SIZE,
} from '../../../../constants';
import formatValue from '../../../../util/format';
import getBarChartOptions from '../../../../util/getBarChartOptions';

const drawYearLabelsPlugin = {
    id: 'drawYearLabelsPlugin',
    afterDraw(chart, _args, opts) {
        if (!opts.active) return;

        const { ctx, chartArea: { top }, scales: { x } } = chart;

        if (!x || !x.getLabels) return;

        const labels = x.getLabels();  // ['January 2022', 'February 2022', ...]
        const yearPositions = new Map();

        labels.forEach((label, index) => {
            const parts = label.split(' ');
            if (parts.length !== 2) return;

            const [, year] = parts;
            const pixel = x.getPixelForTick(index);

            if (!yearPositions.has(year)) {
                yearPositions.set(year, []);
            }
            yearPositions.get(year).push(pixel);
        });

        // Draw year labels above the chart
        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#62626E';

        yearPositions.forEach((positions, year) => {
            const avgX = positions.reduce((a, b) => a + b, 0) / positions.length;
            ctx.fillText(year, avgX, top - 50);  // Adjust Y-position as needed
        });

        ctx.restore();
    }
};



ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels,
    drawYearLabelsPlugin

);

ChartJS.defaults.font.size = parseInt(SMALL_FONT_SIZE);
ChartJS.defaults.color = LIGHT_FONT;
ChartJS.defaults.font.family = EMB_FONT;
ChartJS.defaults.plugins.tooltip.enabled = true;

type Props = {
    description?: string;
    displayHorizontally?: boolean;
    dps?: number;
    enableDownloadAsCSV?: boolean;
    metrics: Measure[];
    lineMetrics?: Measure[];
    results?: DataResponse;
    reverseXAxis?: boolean;
    showLabels?: boolean;
    showLegend?: boolean;
    sortBy?: Dimension | Measure;
    stackMetrics?: boolean;
    KPIvalue?: string;
    title?: string;
    xAxis: Dimension;
    xAxisTitle?: string;
    yAxisTitle?: string;
    granularity?: Granularity;
    showSecondYAxis?: boolean;
    secondAxisTitle?: string;
};

export default function BarChart({ ...props }: Props) {
    return (
        <Chart
            type="bar"
            height="100%"
            options={getBarChartOptions({
                ...props, stacked: false,
                KPIvalue: props.KPIvalue
            })}
            data={chartData(props)}
        />
    );
}

function chartData(props: Props): ChartData<'bar' | 'line'> {
    const { results, xAxis, metrics, granularity, lineMetrics = [], showSecondYAxis, KPIvalue } = props;

    let dateFormat: string | undefined;
    if (xAxis.nativeType === 'time' && granularity) {
        dateFormat = DATE_DISPLAY_FORMATS[granularity];
    }

    const labels = [
        ...new Set(
            results?.data?.map((d: { [p: string]: string }) => {
                const value = d[xAxis];
                return formatValue(value === null ? '' : value, {
                    meta: xAxis?.meta,
                    dateFormat: dateFormat,
                });
            }),
        ),
    ] as string[];

    const BAR_COLOR = '#62626e';
    const LINE_COLORS = ['#62626e', '#F04B55'];

    let selectedMetrics: Measure[] = [];
    let selectedLineMetrics: Measure[] = [];

    if (xAxis === 'receipts_retail.hour' || xAxis === 'receipts_retail.date') {
        if (KPIvalue === 'Sales (Units)') {
            selectedLineMetrics = [lineMetrics[0], lineMetrics[2]];
        }
        else if (KPIvalue === 'Revenue (CLP$)') {
            selectedLineMetrics = [lineMetrics[1], lineMetrics[2]];
        }
        else {
            selectedLineMetrics = lineMetrics;
        }
    }
    else if ((xAxis === 'receipts_retail.dow') || (xAxis === 'receipts_retail.month')) {
        if (KPIvalue === 'Sales (Units)') {
            if (metrics.length > 0) selectedMetrics = [metrics[0]];
            if (lineMetrics.length > 0) selectedLineMetrics = [lineMetrics[lineMetrics.length - 1]];
        }
        else if (KPIvalue === 'Revenue (CLP$)') {
            if (metrics.length > 0) selectedMetrics = [metrics[1]];
            if (lineMetrics.length > 0) selectedLineMetrics = [lineMetrics[lineMetrics.length - 1]];
        }
    }
    else {
        selectedMetrics = metrics;
        selectedLineMetrics = lineMetrics;
    }

    const hoverColorMap: Record<string, string> = {
        '#f04b55': '#af3241',
        '#62626e': '#2d2d37',
    };

    const metricsDatasets = selectedMetrics.map((metric) => ({
        barPercentage: 0.8,
        barThickness: 'flex',
        maxBarThickness: 50,
        minBarLength: 0,
        borderRadius: 4,
        type: 'bar' as const,
        label: metric.title,
        data: results?.data?.map((d) => parseFloat(d[metric.name] || 0)) || [],
        backgroundColor: BAR_COLOR,
        borderColor: BAR_COLOR,
        hoverBackgroundColor: hoverColorMap[BAR_COLOR.toLowerCase()] ?? BAR_COLOR,
        order: 1,
    }));

    const lineMetricsDatasets = selectedLineMetrics.map((metric, i) => ({
        label: metric.title,
        data: results?.data?.map((d) => parseFloat(d[metric.name] || 0)) || [],
        backgroundColor: selectedLineMetrics.length === 2 ? LINE_COLORS[i % LINE_COLORS.length] : '#F04B55',
        borderColor: selectedLineMetrics.length === 2 ? LINE_COLORS[i % LINE_COLORS.length] : '#F04B55',
        hoverBackgroundColor: selectedLineMetrics.length === 2 ? hoverColorMap[LINE_COLORS[i % LINE_COLORS.length].toLowerCase()] ?? LINE_COLORS[i % LINE_COLORS.length] : hoverColorMap['#f04b55'],
        cubicInterpolationMode: 'monotone' as const,
        pointRadius: 2,
        pointHoverRadius: 3,
        type: 'line' as const,
        order: 0,
        yAxisID:
            showSecondYAxis && selectedLineMetrics.length === 2
                ? i === 0
                    ? 'y'
                    : 'y1'
                : 'y1',
    }));

    return {
        labels,
        datasets: [...metricsDatasets, ...lineMetricsDatasets],
    };
}