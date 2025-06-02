import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  InteractionItem,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React, { useRef, useState } from 'react';
import { Pie, getElementAtEvent } from 'react-chartjs-2';

import { EMB_FONT, LIGHT_FONT, SMALL_FONT_SIZE } from '../../../constants';
import formatValue from '../../../util/format';
import Container from '../../Container';

ChartJS.register(
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

ChartJS.defaults.font.size = parseInt(SMALL_FONT_SIZE);
ChartJS.defaults.color = LIGHT_FONT;
ChartJS.defaults.font.family = EMB_FONT;
ChartJS.defaults.plugins.tooltip.enabled = true;
ChartJS.defaults.plugins.tooltip.usePointStyle = true;

type Props = {
  results: DataResponse;
  title: string;
  dps?: number;
  slice: Dimension;
  metrics: Measure[];
  showLabels?: boolean;
  showLegend?: boolean;
  maxSegments?: number;
  displayAsPercentage?: boolean;
  enableDownloadAsCSV?: boolean;
  onClick: (args: { slice: string | null; metric: string | null }) => void;
};

export default (props: Props) => {
  const { results, title, enableDownloadAsCSV, slice, onClick } = props;
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const chartRef = useRef<ChartJS<'pie', []>>(null);

  const fireClickEvent = (element: InteractionItem[]) => {
    if (!element.length || element[0].index === clickedIndex) {
      onClick({ slice: null, metric: null });
      setClickedIndex(null);
      return;
    }
    const { index } = element[0];
    const metricClicked = props.metrics?.[index]?.name || null;
    setClickedIndex(index);
    onClick({
      slice: results.data?.[0]?.[slice.name] ?? null,
      metric: metricClicked,
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { current: chart } = chartRef;
    if (!chart) return;
    fireClickEvent(getElementAtEvent(chart, event));
  };

  return (
    <Container {...props} className="overflow-y-hidden">
      <Pie
        width="100%"
        height="100%"
        options={chartOptions(props)}
        data={chartData(props)}
        ref={chartRef}
        onClick={handleClick}
      />
    </Container>
  );
};

function chartOptions(props: Props): ChartOptions<'pie'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'linear',
    },
    cutout: '50%',
    plugins: {
      datalabels: {
        color: '#6E2332',
        display: props.showLabels ? 'auto' : false,
        backgroundColor: '#fff',
        borderRadius: 8,
        font: {
          family: 'Arial',      // Set font family to Arial
          weight: 'bold',       // Make font bold
          size: 11           // Adjust size as needed
          // Set font color to #6E2332
        },
        align: 'end', // 👈 Places label outside the arc
        anchor: 'end', // 👈 Anchors label to the arc’s edge
        offset: 4,
        formatter: (value, context) => {
          const metric = props.metrics?.[context.dataIndex];
          const metricMeta = metric?.meta;
          const formattedValue = value
            ? formatValue(value, {
              type: 'number',
              dps: props.dps,
              meta: props.displayAsPercentage ? undefined : metricMeta,
            })
            : null;
          const displayValue = props.displayAsPercentage ? `${formattedValue}%` : formattedValue;
          return `${metric?.label || metric?.title || ''} ${displayValue}`;
        },

      },

      tooltip: {
        callbacks: {
          label: function (context) {
            let label = props.metrics?.[context.dataIndex]?.label || '';
            if (context.parsed !== null) {
              label += `: ${formatValue(`${context.parsed || ''}`, {
                type: 'number',
                dps: props.dps,
                meta: props.displayAsPercentage
                  ? undefined
                  : props.metrics?.[context.dataIndex]?.meta,
              })}`;
            }
            return props.displayAsPercentage ? `${label}%` : label;
          },
        },
      },
      legend: {
        display: props.showLegend,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxHeight: 10,
        },
      },
    },
  };
}

function chartData(props: Props) {
  const { results, metrics, displayAsPercentage } = props;
  const row = results.data?.[0];
  if (!row) return { labels: [], datasets: [] };

  const labels = metrics.map((m) => m.label ?? m.name);
  const rawValues = metrics.map((m) => parseFloat(row[m.name] ?? '0'));
  const sum = displayAsPercentage ? rawValues.reduce((a, b) => a + b, 0) : null;
  const values = displayAsPercentage && sum
    ? rawValues.map((v) => (v * 100) / sum)
    : rawValues;

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['#F04B55', '#62626E'], // Updated custom colors
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };
}
