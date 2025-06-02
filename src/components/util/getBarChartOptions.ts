import { DataResponse, Measure } from '@embeddable.com/core';
import { ChartDataset, ChartOptions } from 'chart.js';
import { Chart } from 'chart.js';

import formatValue from '../util/format';
import { setYAxisStepSize } from './chartjs/common';
import { Props } from './getStackedChartData';
import { isTransparent } from 'html2canvas/dist/types/css/types/color';

// We're adding a few properties to use when showing totals on the chart
type ExtendedChartDataset = ChartDataset<'bar' | 'line'> & {
  totals?: { [key: string]: { total: number; lastSegment: number | null } };
  xAxisNames?: string[];
};

const getPadding = (
  showLabels: boolean,
  showTotals: boolean,
  stacked: boolean,
  displayHorizontally: boolean,
) => {
  let left = 0;
  let right = 0;
  let top = 0;
  const bottom = 0;
  if (!stacked) {
    if (displayHorizontally) {
      right = showLabels ? 60 : 0;
      left = showLabels ? 60 : 0;
    } else {
      top = showLabels ? 20 : 20;
    }
  } else {
    if (displayHorizontally) {
      right = showTotals ? 60 : 0;
      left = showTotals ? 60 : 0;
    } else {
      top = showTotals ? 20 : 0;
    }
  }
  return { left, right, top, bottom };
};

export default function getBarChartOptions({
  displayHorizontally = false,
  dps = undefined,
  lineMetrics,
  metric,
  metrics,
  granularity,
  results,
  reverseXAxis = false,
  secondAxisTitle = '',
  segment,
  showLabels = false,
  showLegend = false,
  showSecondYAxis = false,
  showTotals = false,
  stackMetrics = false,
  stacked = false,
  xAxis,
  xAxisTitle = '',
  yAxisTitle = '',
  displayAsPercentage = false,
  isGroupedBar,
  stackBars,
  xAxisPosition = 'top',
  displayYaxis = true,
  displayXaxis = true,
  impression = false,
  performance = false,
  optimization = false,
  Totalperformance = false,
  KPIvalue
}: Partial<Props> & {
  lineMetrics?: Measure[];
  metric?: Measure;
  metrics?: Measure[];
  results?: DataResponse;
  reverseXAxis?: boolean;
  secondAxisTitle?: string;
  showSecondYAxis?: boolean;
  stackMetrics?: boolean;
  stacked?: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
  isGroupedBar?: boolean;
  stackBars?: boolean;
  xAxisPosition?: 'top' | 'bottom';
  displayYaxis?: boolean;
  displayXaxis?: boolean;
  granularity?: string;
  impression?: boolean;
  performance?: boolean;
  optimization?: boolean;
  Totalperformance?: boolean;
  KPIvalue?: string

}): ChartOptions<'bar' | 'line'> {
  const displayedMonths = new Set();
  const displayedYears = new Set();
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: displayHorizontally ? ('y' as const) : ('x' as const),
    layout: {
      padding: getPadding(showLabels, showTotals, stacked, displayHorizontally),
    },
    scales: {
      y: {
        display: displayYaxis,
        stacked: stacked || stackMetrics,
        grace: '0%',
        grid: {
          display: false
        },
        max:
          displayAsPercentage && !displayHorizontally
            ? stackMetrics
              ? 120 // When both displayAsPercentage and stackMetrics are true
              : isGroupedBar
                ? stackBars
                  ? 100
                  : undefined
                : 100
            : undefined,
        afterDataLimits: function (axis) {
          //Disable fractions unless they exist in the data.
          const metricsGroup = [
            ...(metric !== undefined ? [metric] : []),
            ...(metrics || []),
            ...(lineMetrics && !showSecondYAxis ? lineMetrics : []),
          ];
          setYAxisStepSize(axis, results, metricsGroup, dps);
        },
        ticks: {
          callback: function (value: number, index: number, ticks: any[]) {
            const maxY = this.chart.scales.y.max;
            const minY = this.chart.scales.y.min;

            // Skip rendering ticks during animation if the scale is clearly wrong
            if (Math.abs(maxY - minY) < 10 && maxY < 5000) {
              return '';
            }

            // Determine formatting type
            let unit = '';
            let divisor = 1;

            if (maxY >= 1_000_000_000) {
              unit = 'B';
              divisor = 1_000_000_000;
            } else if (maxY >= 5_000_000) {
              unit = 'M';
              divisor = 1_000_000;
            } else if (maxY > 5000) {
              unit = 'k';
              divisor = 1000;
            }

            // Format value
            const formatted = `${(value / divisor).toFixed(0)}${unit}`;

            // Avoid duplicate tick labels
            const prevTick = ticks[index - 1];
            const prevFormatted =
              prevTick !== undefined ? `${(prevTick.value / divisor).toFixed(0)}${unit}` : null;

            if (formatted === prevFormatted) {
              return '';
            }

            return formatted;
          }
        },



        title: {
          display: !!yAxisTitle,
          text: yAxisTitle,
          font: {
            size: 14
          },
        },
      },

      y1: {

        //optional second y-axis for optional line metrics

        display: showSecondYAxis,
        grace: '0%',
        grid: {
          display: false,
        },
        position: 'right',
        ticks: {
          callback: function (value: number, index: number, ticks: any[]) {
            const maxY = this.chart.scales.y1.max;
            const minY = this.chart.scales.y1.min;

            // Skip rendering ticks during animation if the scale is clearly wrong
            if (Math.abs(maxY - minY) < 10 && maxY < 5000) {
              return '';
            }

            // Determine formatting type
            let unit = '';
            let divisor = 1;

            if (maxY >= 1_000_000_000) {
              unit = 'B';
              divisor = 1_000_000_000;
            } else if (maxY >= 5_000_000) {
              unit = 'M';
              divisor = 1_000_000;
            } else if (maxY > 5000) {
              unit = 'k';
              divisor = 1000;
            }

            // Format value
            const formatted = `${(value / divisor).toFixed(0)}${unit}`;

            // Avoid duplicate tick labels
            const prevTick = ticks[index - 1];
            const prevFormatted =
              prevTick !== undefined ? `${(prevTick.value / divisor).toFixed(0)}${unit}` : null;

            if (formatted === prevFormatted) {
              return '';
            }

            return formatted;
          }
        },
        title: {

          display: !!secondAxisTitle,
          text: secondAxisTitle,
        },
        afterDataLimits: function (axis) {
          //Disable fractions unless they exist in the data.
          const metricsGroup = [...(lineMetrics && showSecondYAxis ? lineMetrics : [])];
          setYAxisStepSize(axis, results, metricsGroup, dps);
        },
      },

      x: {

        display: displayXaxis,
        offset: true,
        border: {
          display: false
        },

        reverse: reverseXAxis && !displayHorizontally,
        position: xAxisPosition,
        stacked: stacked || stackMetrics,
        grid: {

          display: false,
          drawTicks: false,


        },

        afterFit: function (axis) {
          axis.paddingTop = 0;    // Reduce top padding
          axis.paddingBottom = 20; // Increase bottom padding
        },
        max:
          displayAsPercentage && displayHorizontally
            ? isGroupedBar
              ? stackBars
                ? 100
                : undefined
              : 100
            : undefined,

        ticks: {
          padding: granularity === 'hour' ? 25 : 20,

          crossAlign: 'near',
          align: 'center',
          font: function () {
            return {
              weight: 'bold',
              family: 'Arial',
              size: 12,
              color: '#62626E'
            };
          },

          //https://www.chartjs.org/docs/latest/axes/labelling.html

          callback: function (value) {
            const full = this.getLabelForValue(parseFloat(`${value}`)); // e.g. "30 Sep"
            // In your ticks callback:
            if (xAxis === 'receipts_retail.month') {
              const [month, year] = full.split(' ');
              return month.substring(0, 3);
            }

            if (xAxis === 'receipts_retail.date') {
              const dateObj = new Date(full);
              if (isNaN(dateObj.getTime())) return full; // Fallback for invalid dates

              const year = dateObj.getFullYear();
              const month = dateObj.getMonth(); // 0 (Jan) to 11 (Dec)

              // Create a unique key for this month (e.g., "2023-0" for January 2023)
              const monthKey = `${year}-${month}`;

              // Skip if this month was already displayed
              if (displayedMonths.has(monthKey)) {
                return null;
              }

              // Mark this month as displayed
              displayedMonths.add(monthKey);

              // Format as "1 Jan 2023" (showing the first of each month)
              const monthStartDate = new Date(year, month, 1);
              const formattedDate = monthStartDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }).replace(/ /g, ' ');

              return '          ' + formattedDate; // regular spaces (not as reliable)

            }
            if (granularity === 'day') {
              return full.split(' ')[0]; // "30"
            }
            if (granularity === 'total') {
              return full.split(' ')[1];   // "17"
            }
            if (granularity === 'week' && performance && !stackMetrics) {
              // full could be something like "2024-02-13 40"
              const parts = full.split(' ');
              const date = parts[2]; // "2024-02-13"
              const date2 = parts[3];
              const weekNumber = parts[1]; // "40"
              return [`Week ${weekNumber}`, `${date} to ${date2}`];  // <<=== RETURN ARRAY!
            }

            if (full.length > 15) {
              // Split the label by spaces
              const words = full.split(' ');

              // Check if it's feasible to split into two lines
              let firstLine = '';
              let secondLine = '';

              words.forEach((word, index) => {
                if (firstLine.length + word.length + 1 <= 15) {
                  // Add word to the first line
                  firstLine += (firstLine.length ? ' ' : '') + word;
                } else {
                  // Add word to the second line
                  secondLine += (secondLine.length ? ' ' : '') + word;
                }
              });

              // Return the two lines
              return [firstLine, secondLine];
            } else {
              return [full]; // If length is under 15, no splitting needed
            }






            if (!displayHorizontally) {
              return full;
            }

            return displayAsPercentage
              ? `${value}%`
              : formatValue(typeof value === 'number' ? value.toString() : value, {
                type: 'number',
              });
          },
        },
        title: {
          font: {
            weight: 'bold',
          },

          display: !!xAxisTitle,
          text: xAxisTitle,
          padding: 20

        },
      },


    },
    animation: {
      duration: 400,
      easing: 'linear',
    },
    plugins: {


      drawYearLabelsPlugin: { active: xAxis === 'receipts_retail.month' },




      monthHeader: { active: granularity === 'day' },
      dateHeader: { active: granularity === 'total' },
      legend: {

        display: showLegend,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxHeight: 8,
          font: {
            size: 12,
            weight: 'bold',
          },
          padding: 20,
          generateLabels: function (chart) {
            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            const labelMap = {
              'Total Frequency': 'Frequency',
              'Total Sale': 'Sales vs Revenue',
              'Total revenue': 'Sales vs Revenue',
              'Without C.A.P': 'Without C.A.P.',
              'With C.A.P': 'With C.A.P.',
              'Sales Uplift (No Negative)': 'Sales Uplift',
              'SP CR Uplift Positive': 'Conversion Uplift',


            };
            return original.map(label => ({
              ...label,
              text: labelMap[label.text] || label.text // Use mapped text if available, otherwise keep original
            }));
          }
          // Adjust padding between legend items
        },
      },
      tooltip: {
        enabled: false,
        external: function (context) {
          const tooltipModel = context.tooltip;

          // Create tooltip element if not exists
          let tooltipEl = document.getElementById('custom-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'custom-tooltip';
            Object.assign(tooltipEl.style, {
              position: 'absolute',
              backgroundColor: 'rgb(255,255,255)',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              fontFamily: 'Arial, sans-serif',
              padding: '8px 12px',
              pointerEvents: 'none',
              color: '#000',
              transition: 'opacity 0.2s ease',
              zIndex: '1000',
            });
            document.body.appendChild(tooltipEl);
          }

          // Hide tooltip if not visible
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          // Extract values
          const titleLines = tooltipModel.title || [];
          const bodyLines = tooltipModel.body.map(b => b.lines).flat();

          const labelCtx = context.tooltip.dataPoints[0];
          const label = labelCtx.dataset.label || '';
          const parsed = labelCtx.parsed;
          const axis = displayHorizontally ? 'x' : 'y';
          const metricIndex = labelCtx.datasetIndex;
          const metricsList = [...(metrics || []), ...(lineMetrics || [])];
          const metricObj = metrics ? metricsList[metricIndex] : metric;

          let value = formatValue(parsed[axis], {
            type: 'number',
            dps: dps,
            meta: displayAsPercentage ? undefined : metricObj?.meta,
          });

          if (displayAsPercentage) value += '%';

          let innerHTML = '';
          const weekdayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];






          if (optimization && titleLines.length && bodyLines.length) {
            const xVal = titleLines[0].split(' ').slice(0, 2).join(' ');

            if (xAxis?.name === 'big_dm.hour_group') {

              //const customIndexMap = [5, 0, 1, 2, 3, 4]; // mapping from dataIndex 0 → 5, 1 → 2, 2 → 3, etc.

              const mappedIndex = labelCtx.dataIndex; // fallback to default if out of bounds
              const fifthMetric = metricsList[7];

              const fifthMetricValue = fifthMetric && results?.data?.[mappedIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              const sixthMetric = metricsList[6];

              const sixthMetricValue = sixthMetric && results?.data?.[mappedIndex]?.[sixthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][sixthMetric.name], { type: 'number', dps: dps })
                : 'N/A';


              if (label === 'Without C.A.P.') {
                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';
                innerHTML = `
                  <div>In hour group <strong style="color:#62626E">${xVal}</strong>, Conversion Rate <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}%</strong></div>
                  ${upliftLine}
                  `;

              }
              else if (label === 'With C.A.P.') {
                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';

                innerHTML = `
        <div>In hour group <strong style="color:#AF3241">${xVal}</strong>, Conversion Rate <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}%</strong></div>
        ${upliftLine}
        `;
              }
              else if (label === 'Without C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';


                innerHTML = `
        <div>In hour group <strong style="color:#62626E">${xVal}</strong>, Average Basket Size <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}</strong></div>
        ${upliftLine}
        `;
              }

              else if (label === 'With C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';


                innerHTML = `
        <div>In <strong style="color:#AF3241">${xVal}</strong>, Average Basket Size <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}</strong></div>
        ${upliftLine}
        `;
              }

              else if (label === 'Sales Uplift (No Negative)') {

                innerHTML = `
        <div>In hour group <strong style="color:#AF3241">${xVal}</strong>, Sales Uplift is <strong style="color:#AF3241">${value}%</strong></div>
      `;
              }

              else if (label === 'SP CR Uplift Positive') {


                innerHTML = `
        <div>In hour group <strong style="color:#AF3241">${xVal}</strong>, Conversion Uplift is <strong style="color:#AF3241">${Math.round(value)}%</strong></div>
      `;
              }


            }

            else if (xAxis?.name === 'big_dm.weekday') {
              const dataIndex = labelCtx.dataIndex; // index of the hovered bar
              const fifthMetric = metricsList[8]; // 5th metric in the list
              const fifthMetricValue = fifthMetric && results?.data?.[dataIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              const sixthMetric = metricsList[6]; // 5th metric in the list
              const sixthMetricValue = sixthMetric && results?.data?.[dataIndex]?.[sixthMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][sixthMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              const seventhMetric = metricsList[7]; // 5th metric in the list
              const seventhMetricValue = seventhMetric && results?.data?.[dataIndex]?.[seventhMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][seventhMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              const ninthMetric = metricsList[9]; // 5th metric in the list
              const ninthMetricValue = ninthMetric && results?.data?.[dataIndex]?.[ninthMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][ninthMetric.name], { type: 'number', dps: dps })
                : 'N/A';



              const weekdayLabel = weekdayMap[Number(xVal) - 1];

              if (label === 'Without C.A.P.') {

                const differenceColor = ninthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const differencePrefix = ninthMetricValue >= 0 ? '+' : '';
                const differenceLine = ninthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Difference between <strong style="color:#AF3241">with C.A.P.</strong> and <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:${differenceColor}">${differencePrefix}${ninthMetricValue}%</strong></div>`
                  : '';

                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';

                innerHTML = `
       <div>On <strong style="color:#62626E">${xVal}</strong>, Conversion Rate <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}%</strong></div>
        ${differenceLine}
       ${upliftLine}
       `;
              }
              else if (label === 'With C.A.P.') {
                const differenceColor = ninthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const differencePrefix = ninthMetricValue >= 0 ? '+' : '';
                const differenceLine = ninthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Difference between <strong style="color:#AF3241">with C.A.P.</strong> and <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:${differenceColor}">${differencePrefix}${ninthMetricValue}%</strong></div>`
                  : '';

                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';

                innerHTML = `
       <div>On <strong style="color:#AF3241">${xVal}</strong>, Conversion Rate <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}%</strong></div>
       ${differenceLine}
       ${upliftLine}
       `;
              }
              else if (label === 'Without C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';

                const differenceColor = seventhMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const differencePrefix = seventhMetricValue >= 0 ? '+' : '';
                const differenceLine = seventhMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Difference between <strong style="color:#AF3241">with C.A.P.</strong> and <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:${differenceColor}">${differencePrefix}${seventhMetricValue}</strong></div>`
                  : '';


                innerHTML = `
       <div>On <strong style="color:#62626E">${xVal}</strong>, Average Basket Size <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}</strong></div>
      ${differenceLine}
       ${upliftLine}
       `;
              }

              else if (label === 'With C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';

                const differenceColor = seventhMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const differencePrefix = seventhMetricValue >= 0 ? '+' : '';
                const differenceLine = seventhMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Difference between <strong style="color:#AF3241">with C.A.P.</strong> and <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:${differenceColor}">${differencePrefix}${seventhMetricValue}</strong></div>`
                  : '';


                innerHTML = `
       <div>On <strong style="color:#AF3241">${xVal}</strong>, Average Basket Size <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}</strong></div>
       ${differenceLine}
       ${upliftLine}
       `;
              }

              else if (label === 'Sales Uplift (No Negative)') {

                innerHTML = `
       <div>On <strong style="color:#AF3241">${xVal}</strong>, Sales Uplift is <strong style="color:#AF3241">${value}%</strong></div>
     `;
              }

              else if (label === 'SP CR Uplift Positive') {

                innerHTML = `
       <div>On <strong style="color:#AF3241">${xVal}</strong>, Conversion Uplift is <strong style="color:#AF3241">${Math.round(value)}%</strong></div>
     `;
              }


            }

            else if (xAxis?.name === 'big_dm.name_store') {
              const dataIndex = labelCtx.dataIndex; // index of the hovered bar
              const fifthMetric = metricsList[7]; // 5th metric in the list
              const fifthMetricValue = fifthMetric && results?.data?.[dataIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              const sixthMetric = metricsList[6]; // 5th metric in the list
              const sixthMetricValue = sixthMetric && results?.data?.[dataIndex]?.[sixthMetric.name] !== undefined
                ? formatValue(results.data[dataIndex][sixthMetric.name], { type: 'number', dps: dps })
                : 'N/A';


              if (label === 'Without C.A.P.') {
                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';

                innerHTML = `
     <div>In <strong style="color:#62626E">${xVal}</strong>, Conversion Rate <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}%</strong></div>
    ${upliftLine}
     `;
              }
              else if (label === 'With C.A.P.') {
                const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
                const upliftLine = fifthMetricValue != null
                  ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                  : '';

                innerHTML = `
     <div>In <strong style="color:#AF3241">${xVal}</strong>, Conversion Rate <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}%</strong></div>
     ${upliftLine}
     `
                  ;
              }
              else if (label === 'Without C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';


                innerHTML = `
     <div>In <strong style="color:#62626E">${xVal}</strong>, Average Basket Size <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}</strong></div>
    ${upliftLine}
     `;
              }

              else if (label === 'With C.A.P') {
                const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
                const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
                const upliftLine = sixthMetricValue != null
                  ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                  : '';


                innerHTML = `
     <div>In <strong style="color:#AF3241">${xVal}</strong>, Average Basket Size <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}</strong></div>
     ${upliftLine}
     `;
              }

              else if (label === 'Sales Uplift (No Negative)') {

                innerHTML = `
     <div>In <strong style="color:#AF3241">${xVal}</strong>, Sales Uplift is <strong style="color:#AF3241">${value}%</strong></div>
   `;
              }

              else if (label === 'SP CR Uplift Positive') {

                innerHTML = `
     <div>In <strong style="color:#AF3241">${xVal}</strong>, Conversion Uplift is <strong style="color:#AF3241">${Math.round(value)}%</strong></div>
   `;
              }


            }

          }

          else if (Totalperformance && titleLines.length && bodyLines.length) {
            const xVal = titleLines[0];  // This gives you the full first line
            const dataIndex = labelCtx.dataIndex;
            const fifthMetric = metricsList[5];
            const sixthMetric = metricsList[6];

            // Get raw numeric values first before formatting
            const fifthRawValue = fifthMetric && results?.data?.[dataIndex]?.[fifthMetric.name] !== undefined
              ? Number(results.data[dataIndex][fifthMetric.name])
              : NaN;

            const sixthRawValue = sixthMetric && results?.data?.[dataIndex]?.[sixthMetric.name] !== undefined
              ? Number(results.data[dataIndex][sixthMetric.name])
              : NaN;

            // Format for display (if needed elsewhere)
            const fifthMetricValue = !isNaN(fifthRawValue)
              ? formatValue(fifthRawValue, { type: 'number', dps: dps })
              : 'N/A';

            const sixthMetricValue = !isNaN(sixthRawValue)
              ? formatValue(sixthRawValue, { type: 'number', dps: dps })
              : 'N/A';

            // Use Math.round on the raw numbers, not the formatted strings
            const fifthRounded = !isNaN(fifthRawValue) ? Math.round(fifthRawValue) : 'N/A';
            const sixthRounded = !isNaN(sixthRawValue) ? Math.round(sixthRawValue) : 'N/A';

            if (label === 'Without C.A.P.') {
              innerHTML = `
  <div>Analysis group <strong style="color:#AF3241">"${xVal}"</strong></div>
  <div style="margin-top: 8px;"><strong style="color:#62626E">Without C.A.P.</strong> every <strong style="color:#62626E">${fifthRounded}th</strong> shopper converted</div>
  <div style="margin-top: 8px;"><strong style="color:#AF3241">With C.A.P.</strong> every <strong style="color:#AF3241">${sixthRounded}th</strong> shopper converted</div>
  `;
            }
            else if (label === 'With C.A.P.') {
              innerHTML = `
  <div>Analysis group <strong style="color:#AF3241">"${xVal}"</strong></div>
  <div style="margin-top: 8px;"><strong style="color:#62626E">Without C.A.P.</strong> every <strong style="color:#62626E">${fifthRounded}th</strong> shopper converted</div>
  <div style="margin-top: 8px;"><strong style="color:#AF3241">With C.A.P.</strong> every <strong style="color:#AF3241">${sixthRounded}th</strong> shopper converted</div>
  `;
            }
            else if (label === 'Without C.A.P') {

              innerHTML = `
              <div>Analysis group <strong style="color:#AF3241">"${xVal}"</strong></div>
      <div style="margin-top: 8px;">Basket Size <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}</strong></div>
      
      `;
            }

            else if (label === 'With C.A.P') {

              innerHTML = `
      <div>Analysis group <strong style="color:#AF3241">"${xVal}"</strong></div>
      <div style="margin-top: 8px;">Basket Size <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}</strong></div>
      
      `;
            }

            else if (label === 'Sales Uplift (No Negative)') {

              innerHTML = `
               <div>Analysis group <strong style="color:#AF3241">"${xVal}"</strong></div>
      <div style="margin-top: 8px;">Sales Uplift is <strong style="color:#AF3241">${value}%</strong></div>
      
              `;
            }
          }



          else if (performance && granularity && titleLines.length && bodyLines.length) {
            const xVal = titleLines[0].split(' ').slice(0, 2).join(' ');
            const dataIndex = labelCtx.dataIndex;
            const fifthMetric = metricsList[2];

            const fifthMetricValue = fifthMetric && results?.data?.[dataIndex]?.[fifthMetric.name] !== undefined
              ? formatValue(results.data[dataIndex][fifthMetric.name], { type: 'number', dps: dps })
              : 'N/A';

            const sixthMetric = metricsList[2];

            const sixthMetricValue = sixthMetric && results?.data?.[dataIndex]?.[sixthMetric.name] !== undefined
              ? formatValue(results.data[dataIndex][sixthMetric.name], { type: 'number', dps: dps })
              : 'N/A';


            if (label === 'Without C.A.P.') {
              const upliftColor = fifthMetricValue >= 0 ? '#00aa00' : '#F04B55';
              const upliftPrefix = fifthMetricValue >= 0 ? '+' : '';
              const upliftLine = fifthMetricValue != null

                ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(fifthMetricValue)}% Uplift</strong></div>`
                : '';

              innerHTML = `
      <div>In <strong style="color:#62626E">${xVal}</strong>, Conversion Rate <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}%</strong></div>
      ${upliftLine}
      `;
            }

            else if (label === 'With C.A.P.') {
              const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
              const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
              const upliftLine = sixthMetricValue != null
                ? `<div style="margin-top: 8px;">Conversion Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                : '';

              innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Conversion Rate <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}%</strong></div>
      ${upliftLine}
      `;
            }

            else if (label === 'Without C.A.P') {

              const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
              const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
              const upliftLine = sixthMetricValue != null

                ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                : '';

              innerHTML = `
      <div>In <strong style="color:#62626E">${xVal}</strong>, Average Basket Size <strong style="color:#62626E">without C.A.P.</strong> is <strong style="color:#62626E">${value}</strong></div>
      ${upliftLine}
      `;
            }

            else if (label === 'With C.A.P') {
              const upliftColor = sixthMetricValue >= 0 ? '#00aa00' : '#F04B55';
              const upliftPrefix = sixthMetricValue >= 0 ? '+' : '';
              const upliftLine = sixthMetricValue != null

                ? `<div style="margin-top: 8px;">Basket Uplift is <strong style="color:${upliftColor}">${upliftPrefix}${Math.round(sixthMetricValue)}% Uplift</strong></div>`
                : '';

              innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Average Basket Size <strong style="color:#AF3241">with C.A.P.</strong> is <strong style="color:#AF3241">${value}</strong></div>
      ${upliftLine}
      `;
            }
            else if (label === 'Sales without C.A.P') {
              if (displayAsPercentage) {
                innerHTML = `
      <div>In <strong style="color:#62626E">${xVal}</strong>, Sales <strong style="color:#62626E">without C.A.P.</strong> are <strong style="color:#62626E">${value}</strong></div>
    `;
              }

              else {
                innerHTML = `
      <div>In <strong style="color:#62626E">${xVal}</strong>, Sales <strong style="color:#62626E">without C.A.P.</strong> are <strong style="color:#62626E">${value}</strong> products</div>
    `;
              }
            }

            else if (label === 'Sales with C.A.P') {

              if (displayAsPercentage) {
                innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Sales <strong style="color:#AF3241">with C.A.P.</strong> are <strong style="color:#AF3241">${value}</strong></div>
    `;
              }
              else {
                innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Sales <strong style="color:#AF3241">with C.A.P.</strong> are <strong style="color:#AF3241">${value}</strong> products</div>
    `;
              }
            }

            else if (label === 'Revenue without C.A.P') {
              if (!displayAsPercentage) {

                innerHTML = `
      <div>In <strong style="color:#62626E">${xVal}</strong>, Sales in CLP$ <strong style="color:#62626E">without C.A.P.</strong> are <strong style="color:#62626E">$${value}</strong> products</div>
    `;
              }
              else {
                innerHTML = `
                <div>In <strong style="color:#62626E">${xVal}</strong>, Sales in CLP$ <strong style="color:#62626E">without C.A.P.</strong> are <strong style="color:#62626E">${value}</strong></div>
              `;
              }
            }
            else if (label === 'Revenue with C.A.P') {
              if (!displayAsPercentage) {
                innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Sales in CLP$ <strong style="color:#AF3241">with C.A.P.</strong> are <strong style="color:#AF3241">$${value}</strong> products</div>
    `;
              } else {
                innerHTML = `
      <div>In <strong style="color:#AF3241">${xVal}</strong>, Sales in CLP$ <strong style="color:#AF3241">with C.A.P.</strong> are <strong style="color:#AF3241">${value}</strong></div>
    `;
              }
            }



          }
          else if (xAxis?.name === 'impressions.name_store') {
            const xVal = titleLines[0];
            if (xVal === 'Total') {
              innerHTML = `
                  <div>For all stores, impressions are <strong style="color:#AF3241">${value}</strong></div>
              `;
            } else {
              innerHTML = `
      <div>In Store <strong style="color:#AF3241">${xVal}</strong>, Impressions are <strong style="color:#AF3241">${value}</strong></div>
    `;
            }

          }

          else if (xAxis === 'receipts_retail.dow') {
            const xVal = titleLines[0].split(' ').slice(0, 2).join(' ');

            if (KPIvalue === "Sales (Units)") {
              console.log(metricObj?.name)
              if (metricObj?.name === "receipts_retail.sum_sale") {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Sales Units were generated in the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }

            }

            else if (KPIvalue === "Revenue (CLP$)") {
              if (metricObj?.name === "receipts_retail.sum_revenue") {
                innerHTML =
                  `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  `;

              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Revenue (CLP$) were generated in the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }

            }
          }

          else if (xAxis === 'receipts_retail.month') {
            const xVal = titleLines[0].split(' ').slice(0, 2).join(' ');

            if (KPIvalue === "Sales (Units)") {
              if (metricObj?.name === "receipts_retail.sum_sale") {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Sales Units were generated in the store in the month of <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store in the month of <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }
            }

            else if (KPIvalue === "Revenue (CLP$)") {
              if (metricObj?.name === "receipts_retail.sum_revenue") {
                innerHTML =
                  innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store in the month of <strong style="color:#AF3241">${xVal}</strong></div>
                  `;

              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Revenue (CLP$) were generated in the store in the month of <strong style="color:#AF3241">${xVal}</strong></div>
                  `;
              }
            }
          }

          else if (xAxis === 'receipts_retail.hour') {
            const xVal = titleLines[0].split(' ').slice(0, 2).join(' ');


            if (KPIvalue === "Sales (Units)") {
              const mappedIndex = labelCtx.dataIndex; // fallback to default if out of bounds
              const fifthMetric = metricsList[2];

              const fifthMetricValue = fifthMetric && results?.data?.[mappedIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';
              if (metricObj?.name === "receipts_retail.sum_sale") {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Sales Units were generated in the store at hour <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Sales (Units) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  
                  `;
              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store at hour <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Sales (Units) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  `;
              }
            }

            else if (KPIvalue === "Revenue (CLP$)") {
              const mappedIndex = labelCtx.dataIndex; // fallback to default if out of bounds
              const fifthMetric = metricsList[3];

              const fifthMetricValue = fifthMetric && results?.data?.[mappedIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';
              if (metricObj?.name === "receipts_retail.sum_revenue") {
                innerHTML =
                  `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store at hour <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Revenue (CLP$) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  
                  `;

              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Revenue (CLP$) were generated in the store at hour <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Revenue (CLP$) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  
                  `;
              }
            }
          }

          else if (xAxis === 'receipts_retail.date') {
            const isoString = titleLines[0];
            const date = new Date(isoString);

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
            const year = date.getFullYear();

            const xVal = `${day}.${month}.${year}`;


            if (KPIvalue === "Sales (Units)") {
              const mappedIndex = labelCtx.dataIndex; // fallback to default if out of bounds
              const fifthMetric = metricsList[2];

              const fifthMetricValue = fifthMetric && results?.data?.[mappedIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';

              if (metricObj?.name === "receipts_retail.sum_sale") {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Sales Units were generated in the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Sales (Units) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  
                  `;
              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Sales (Units) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  
                  `;
              }
            }

            else if (KPIvalue === "Revenue (CLP$)") {
              const mappedIndex = labelCtx.dataIndex; // fallback to default if out of bounds
              const fifthMetric = metricsList[3];

              const fifthMetricValue = fifthMetric && results?.data?.[mappedIndex]?.[fifthMetric.name] !== undefined
                ? formatValue(results.data[mappedIndex][fifthMetric.name], { type: 'number', dps: dps })
                : 'N/A';
              if (metricObj?.name === "receipts_retail.sum_revenue") {
                innerHTML =
                  `
                  <div><strong style="color:#AF3241">${value}</strong> shoppers visited the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Revenue (CLP$) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  `;

              }
              else {
                innerHTML = `
                  <div><strong style="color:#AF3241">${value}</strong> Revenue (CLP$) were generated in the store on <strong style="color:#AF3241">${xVal}</strong></div>
                  <div style="margin-top: 8px;">Average Revenue (CLP$) is <strong style="color:#AF3241">${fifthMetricValue}</strong></div>
                  `;
              }
            }
          }

          else if (impression && granularity && titleLines.length && bodyLines.length) {
            const xVal = titleLines[0];

            let [firstPart, secondPart] = xVal.split(" "); // Adjust this depending on the format of xVal

            let [year, month, day] = firstPart.split("-");
            let formattedDate = `${day}.${month}.${year}`;

            // Get day of the week
            let dateObj = new Date(`${year}-${month}-${day}`);
            let options = { weekday: 'long' };
            let dayOfWeek = dateObj.toLocaleDateString('en-US', options);

            // Capitalize first letter (optional)
            dayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);


            function expandMonthName(xVal) {
              const monthMap = {
                Jan: 'January',
                Feb: 'February',
                Mar: 'March',
                Apr: 'April',
                May: 'May',
                Jun: 'June',
                Jul: 'July',
                Aug: 'August',
                Sept: 'September',
                Sep: 'September',
                Oct: 'October',
                Nov: 'November',
                Dec: 'December',
              };

              let [day, shortMonth] = xVal.split(" ");
              let fullMonth = monthMap[shortMonth];
              return `${day} ${fullMonth}`;
            }

            let prefix = '';
            switch (granularity) {
              case 'hour':
                prefix = `At hour <strong style="color:#a53241">${xVal}</strong>, Impressions are `;
                break;
              case 'hour_group':
                prefix = `In hour group <strong style="color:#a53241">${xVal}</strong>, Impressions are `;
                break;
              case 'day':
                const expandedDate = expandMonthName(xVal);
                prefix = `On <strong style="color:#a53241">${expandedDate}</strong>, Impressions are `;
                break;

              case 'week':
                prefix = `In <strong style="color:#a53241">${xVal}</strong>, Impressions are `;
                break;
              case 'month':
                prefix = `In the month of <strong style="color:#a53241">${xVal}</strong>, Impressions are `;
                break;
              case 'total':
                prefix = `On <strong style="color:#a53241">${formattedDate} (${dayOfWeek})</strong> at <strong style="color:#a53241">${secondPart}</strong>, Impressions were `;
                break;
              default:
                prefix = `<strong style="color:#a53241">${xVal}</strong>: `;
            }

            innerHTML = `<div>${prefix}<strong style="color:#a53241">${value}</strong></div>`;
          } else {
            innerHTML = `<div><strong style="color:#a53241">${label}</strong>: ${value}</div>`;
          }


          tooltipEl.innerHTML = innerHTML;

          // Positioning
          const position = context.chart.canvas.getBoundingClientRect();
          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
        }
      },

      datalabels: {
        labels: {
          total: {
            anchor: (context) => {
              const dataset = context.dataset as ExtendedChartDataset;
              const totals = dataset.totals;

              if (!totals) {
                return 'end';
              }
              const currXAxisName = dataset.xAxisNames?.[context.dataIndex];
              const currTotal = totals[currXAxisName || '']?.total;
              if (currTotal && currTotal < 0) {
                return 'start';
              }
              return 'end';
            },
            align: (context) => {
              const dataset = context.dataset as ExtendedChartDataset;
              const totals = dataset.totals;
              if (!totals) {
                return displayHorizontally ? 'right' : 'top';
              }
              const currXAxisName = dataset.xAxisNames?.[context.dataIndex];
              const currTotal = totals[currXAxisName || '']?.total;
              if (currTotal && currTotal < 0) {
                return displayHorizontally ? 'left' : 'bottom';
              }
              return displayHorizontally ? 'right' : 'top';
            },
            display: showTotals && stackBars ? 'true' : false,
            font: {
              weight: 'bold',
            },
            color: stackMetrics ? '#FFFFFF' : undefined,
            formatter: (v, context) => {
              const dataset = context.dataset as ExtendedChartDataset;
              const xAxisNames = dataset.xAxisNames;
              const totals = dataset.totals;
              if (!totals || !xAxisNames) {
                return '';
              }
              const currxAxisName = xAxisNames[context.dataIndex];
              const currDatasetIndex = context.datasetIndex;
              if (currDatasetIndex === totals[currxAxisName]?.lastSegment && v !== null) {
                const barTotal = displayAsPercentage
                  ? '100'
                  : totals[currxAxisName].total.toString();
                let val = formatValue(barTotal, {
                  type: 'number',
                  dps: dps,
                  meta: displayAsPercentage ? undefined : metric?.meta,
                });
                if (displayAsPercentage) {
                  val += '%';
                }
                return val;
              } else {
                return ''; // has to be here or chartjs decides we want a number on every bart part
              }
            },
          },
          value: {
            color: stackMetrics ? '#FFFFFF' : undefined,
            anchor: stacked || stackMetrics ? 'center' : 'end',
            align: stacked || stackMetrics ? 'center' : 'end',
            display: showLabels ? 'auto' : false,
            formatter: (v, context) => {
              // metric needed for formatting
              const metricIndex = context.datasetIndex;
              const metricsList = [...(metrics || []), ...(lineMetrics || [])];
              const metricObj = metrics ? metricsList[metricIndex] : metric;

              if (v === null || v === 0) return null;   // ← NEW: also skip zeros

              let val = formatValue(v, {
                type: 'number',
                dps: dps,
                meta: displayAsPercentage ? undefined : metricObj?.meta,
              });
              if (displayAsPercentage) val += '%';
              return val;
            },
            padding: -12,
          },

        },
      },
    },
  };
}
