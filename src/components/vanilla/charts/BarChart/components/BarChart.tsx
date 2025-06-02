/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { translateText } from '../../../translateText';

import React, { useEffect, useState, useMemo } from 'react';
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
import { Chart } from 'react-chartjs-2';

import {
  DATE_DISPLAY_FORMATS,
  EMB_FONT,
  LIGHT_FONT,
  SMALL_FONT_SIZE,
} from '../../../../constants';
import formatValue from '../../../../util/format';
import getBarChartOptions from '../../../../util/getBarChartOptions';
import { toDate } from 'date-fns';

/********************************************************************
 * PLUGINS
 ********************************************************************/
const StringMetricPlugin = {
  id: 'stringMetric',
  afterDraw(chart, args, options) {
    if (!options.enabled || !options.metrics?.length || !options.rawData) return;

    const { ctx, chartArea } = chart;

    // Get the last metric
    const lastMetric = options.metrics[options.metrics.length - 1];
    if (!lastMetric?.name) return;

    // Get the string value from the first data point and capitalize first letter
    const rawValue = options.rawData[0]?.[lastMetric.name] || '';
    const stringValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

    if (!stringValue) return;

    ctx.save();

    // Position text in the middle at the very top of the canvas
    const xPos = chartArea.left + (chartArea.right - chartArea.left) / 2;
    const yPos = 20; // Fixed position from top of canvas

    // Draw the text with capitalized first letter
    ctx.font = `bold 12px ${ChartJS.defaults.font.family}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2D2D37'; // Keeping your dark gray color
    ctx.fillText(stringValue, xPos, yPos);

    ctx.restore();
  }
};

const TotalSeparatorPlugin = {
  id: 'totalSeparator',
  beforeDatasetsDraw(chart, args, options) {
    if (!options.enabled) return;

    const { ctx, data, chartArea: { top, bottom }, scales: { x } } = chart;

    const totalIndex = data.labels.indexOf('Total');
    if (totalIndex === -1) return;

    // Get the start position of the Total bar
    const totalBarX = x.getPixelForValue(totalIndex);
    const barWidth = x.getPixelForValue(1) - x.getPixelForValue(0); // Estimate bar width

    // Position line at the left edge of the Total bar
    const xPos = totalBarX - barWidth / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPos, top);  // 10 pixels above chart top
    ctx.lineTo(xPos, bottom + 37);  // 10 pixels below chart bottom
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();
    ctx.restore();
  }
};

const DateHeaderPlugin = {
  id: 'dateHeader',
  afterDraw(chart, _args, opts) {
    if (!opts.active) return;

    const {
      ctx,
      scales: { x },
    } = chart;
    ctx.save();
    ctx.font = `bold 11px ${ChartJS.defaults.font.family}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ChartJS.defaults.color as string;

    const dateBuckets: Record<string, number[]> = {};
    x.ticks.forEach((t, i) => {
      const fullLbl = x.getLabelForValue(t.value) as string; // "2024-12-20 17"
      const [date] = fullLbl.split(' '); // "2024-12-20"
      (dateBuckets[date] ??= []).push(i);
    });

    Object.entries(dateBuckets).forEach(([d, idxArr]) => {
      const first = idxArr[0];
      const last = idxArr[idxArr.length - 1];
      const xPos = (x.getPixelForTick(first) + x.getPixelForTick(last)) / 2;
      const yPos = x.top - 6;
      ctx.fillText(d, xPos, yPos);
    });
    ctx.restore();
  },
} as const;






const MonthHeaderPlugin = {
  id: 'monthHeader',
  afterDraw(chart, _args, opts) {
    if (!opts.active) return;

    const {
      ctx,
      scales: { x },
    } = chart;
    ctx.save();
    ctx.font = `bold 11px ${ChartJS.defaults.font.family}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ChartJS.defaults.color as string;

    const monthMap: Record<string, string> = {
      'Jan': 'January',
      'Feb': 'February',
      'Mar': 'March',
      'Apr': 'April',
      'May': 'May',
      'Jun': 'June',
      'Jul': 'July',
      'Aug': 'August',
      'Sep': 'September',
      'Sept': 'September',
      'Oct': 'October',
      'Nov': 'November',
      'Dec': 'December'
    };

    const monthBuckets: Record<string, number[]> = {};
    x.ticks.forEach((t, i) => {
      const label = x.getLabelForValue(t.value) as string; // "30 Sep"
      const [, month] = label.split(' ');
      (monthBuckets[month] ??= []).push(i);
    });

    Object.entries(monthBuckets).forEach(([abbr, idxArr]) => {
      const first = idxArr[0];
      const last = idxArr[idxArr.length - 1];
      const xPos = (x.getPixelForTick(first) + x.getPixelForTick(last)) / 2;
      const yPos = x.top - 6;
      ctx.fillText(monthMap[abbr] || abbr, xPos, yPos);
    });

    ctx.restore();
  },
} as const;

/********************************************************************
 * CHART.JS GLOBAL CONFIG
 ********************************************************************/
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
  MonthHeaderPlugin,
  DateHeaderPlugin,
  TotalSeparatorPlugin,
  StringMetricPlugin

);

ChartJS.defaults.font.size = parseInt(SMALL_FONT_SIZE);
ChartJS.defaults.color = LIGHT_FONT;
ChartJS.defaults.font.family = EMB_FONT;
ChartJS.defaults.plugins.tooltip.enabled = true;

/********************************************************************
 * TYPES
 ********************************************************************/
type Props = {
  description?: string;
  displayHorizontally?: boolean;
  dps?: number;
  enableDownloadAsCSV?: boolean;
  metrics: Measure[];
  AbsolutePercentage?: boolean;
  lineMetrics?: Measure[];
  results?: DataResponse;
  reverseXAxis?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  sortBy?: Dimension | Measure;
  stackMetrics?: boolean;
  title?: string;
  xAxis: Dimension;
  xAxisTitle?: string;
  yAxisTitle?: string;
  granularity?: string;
  showSecondYAxis?: boolean;
  secondAxisTitle?: string;
  xAxisPosition?: string;
  displayYaxis?: boolean;
  displayXaxis?: boolean;
  clientContext?: {
    language?: string;
  };
  round?: boolean;
  TotalStores?: boolean;
  PercentageSign?: boolean;
  impression?: boolean;
  performance?: boolean;
  Totalperformance?: boolean;
  KPIvalue?: string[];
  optimization?: boolean;
  onToggleLabels?: (show: boolean) => void;
};


/********************************************************************
 * MAIN COMPONENT
 ********************************************************************/

export default function BarChart({ ...props }: Props) {
  const { clientContext, title, metrics, granularity, PercentageSign, AbsolutePercentage, impression, performance, KPIvalue, xAxis, Totalperformance } = props;
  const language = clientContext?.language;












  const [translatedTitle, setTranslatedTitle] = useState<string | undefined>(title);
  const [translatedMetrics, setTranslatedMetrics] = useState<string[]>(metrics.map((m) => m.title));

  useEffect(() => {
    const translateAll = async () => {
      if (!language) return;

      if (title) {
        setTranslatedTitle(await translateText(title, language));
      }

      setTranslatedMetrics(await Promise.all(metrics.map((m) => translateText(m.title, language))));
    };

    translateAll();
  }, [language, title, metrics]);
  console.log("metric.name:", metrics);

  const updatedPercentageSign =
    KPIvalue?.includes('Conversion Rate') ||
      KPIvalue?.includes('Sales Uplift') ||
      KPIvalue?.includes('Conversion Uplift')
      ? true
      : PercentageSign;


  const options = useMemo(() => {
    let updatedOptions = getBarChartOptions({
      ...props,

      granularity,
      stacked: props.stackMetrics,
      displayAsPercentage: props.AbsolutePercentage,
      xAxisPosition: props.xAxisPosition === 'top' ? 'top' : 'bottom',
      displayYaxis: props.displayYaxis,
      displayXaxis: props.displayXaxis, // Passing the state value to the chart options
      impression: props.impression,
      performance: props.performance,
      optimization: props.optimization,
      showLabels: props.showLabels,
    });

    // Check if xAxis.name equals 'big_dm.weekday' and update the xAxis labels
    //if (props.xAxis.name === 'big_dm.weekday') {
      // Define day names for Sunday to Saturday
      //const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      // Modify xAxis tick callback to show day names
      //updatedOptions.scales.x.ticks.callback = (value: number) => {
        //return dayNames[value]; // Map 0 -> 'Sunday', 1 -> 'Monday', etc.
      //};
    //}




    return updatedOptions;
  }, [props, props.showLabels]);




  // ----- append % sign to labels/ticks when requested -----
  // ----- append % sign to labels/ticks when requested -----
  if (updatedPercentageSign) {
    options.plugins = {
      ...options.plugins,
      datalabels: {
        ...options.plugins?.datalabels,
        labels: {
          ...(options.plugins?.datalabels?.labels || {}),
          value: {
            ...options.plugins?.datalabels?.labels?.value,

            formatter: (v: number) => {
              if (v === null) return '';
              return Number.isInteger(v) ? `${v}%` : `${v.toFixed(2)}%`;
            }


          },
        },
      },
      tooltip: {
        ...options.plugins?.tooltip,
        callbacks: {
          ...(options.plugins?.tooltip?.callbacks || {}),
          label: (ctx: any) => `${ctx.raw.toFixed(2)}%`, // Rounds to 2 decimals
        },
      },
    };

    if (!options.scales) options.scales = {};
    ['y', 'y1'].forEach((axis) => {
      if (options.scales?.[axis]) {
        // @ts-ignore dynamic access
        options.scales[axis].ticks = {
          ...(options.scales[axis].ticks || {}),
          callback: (val: number | string) => `${Number(val).toFixed(2)}%`, // Rounds to 2 decimals
        };
      }
    });
  }


  else if (!props.AbsolutePercentage && props.stackMetrics && KPIvalue?.includes('Sales in CLP$')) {
    options.plugins = {
      ...options.plugins,
      datalabels: {
        ...options.plugins?.datalabels,
        labels: {
          ...(options.plugins?.datalabels?.labels || {}),
          value: {
            ...options.plugins?.datalabels?.labels?.value,

            formatter: (v: number) => {
              if (v === null) return '';
              return `$${v.toLocaleString('en-US')}`;
            }

          },
        },
      },
    }
  }

  // --------------------------------------------------------

  // --------------------------------------------------------
  const toggleLabels = () => {
    if (props.onToggleLabels) {
      props.onToggleLabels(!props.showLabels);
    }
  };



  const StackedTotalPlugin = {
    id: 'stackedTotalPlugin',
    afterDatasetsDraw(chart: any) {
      const { ctx, data, scales } = chart;
      const xAxis = scales.x;
      const yAxis = scales.y;

      // Access plugin options
      const AbsolutePercentage = chart.options.plugins.stackedTotalPlugin?.AbsolutePercentage;
      const KPIvalue = chart.options.plugins.stackedTotalPlugin?.KPIvalue;
      const stackMetrics = chart.options.plugins.stackedTotalPlugin?.stackMetrics;

      // Store total values and positions for tooltip
      const totalValues: { x: number, y: number, value: number, label: string }[] = [];

      data?.labels?.forEach((label, i) => {
        let total = 0;
        let barTop = Number.POSITIVE_INFINITY;

        data.datasets.forEach((dataset: any) => {
          const meta = chart.getDatasetMeta(data.datasets.indexOf(dataset));
          const bar = meta.data[i];
          const value = dataset.data[i];

          if (bar && typeof value === 'number' && !dataset.hidden) {
            total += value;
            barTop = Math.min(barTop, bar.y);
          }
        });

        if (!isFinite(barTop)) return;

        ctx.save();
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';

        let formattedTotal = total.toLocaleString("en-US");

        if (stackMetrics && KPIvalue?.includes('Sales in CLP$') && !AbsolutePercentage) {
          formattedTotal = `$${formattedTotal}`;
        } else if (AbsolutePercentage) {
          formattedTotal = `${formattedTotal}%`;
        }

        const xPos = xAxis.getPixelForTick(i);
        const yPos = barTop - 10;

        ctx.fillText(formattedTotal, xPos, yPos);
        ctx.restore();

        // Store position and value for tooltip
        totalValues.push({
          x: xPos,
          y: yPos,
          value: total,
          label: label.toString()
        });
      });

      // Add tooltip functionality
      if (chart.totalTooltip) {
        chart.totalTooltip.destroy();
      }

      const tooltipEl = document.createElement('div');
      tooltipEl.id = 'custom-total-tooltip';
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
        opacity: '0'
      });
      document.body.appendChild(tooltipEl);

      chart.totalTooltip = {
        element: tooltipEl,
        destroy: () => {
          if (tooltipEl.parentNode) {
            tooltipEl.parentNode.removeChild(tooltipEl);
          }
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const hoveredTotal = totalValues.find(total =>
          Math.abs(mouseX - total.x) < 20 &&
          Math.abs(mouseY - total.y) < 20
        );

        if (hoveredTotal) {
          tooltipEl.style.opacity = '1';

          // Format the value based on conditions
          let displayValue = hoveredTotal.value.toLocaleString("en-US");
          if (AbsolutePercentage) {
            displayValue += '%';
          } else if (stackMetrics && KPIvalue?.includes('Sales in CLP$')) {
            displayValue = `$${displayValue}`;
          }

          // Create the tooltip content
          // Extract the first two words of the label
          const labelParts = hoveredTotal.label.split(' ');
          const labelText = labelParts.slice(0, 2).join(' ');

          // Create the tooltip content with the updated label
          const tooltipText = KPIvalue?.includes('Sales in CLP$')
            ? `In <strong style="color:#AF3241">${labelText},</strong> Total Sales in CLP$ are <strong style="color:#AF3241">${displayValue}</strong>`
            : `In <strong style="color:#AF3241">${labelText},</strong> Total Sales are <strong style="color:#AF3241">${displayValue}</strong>`;

          tooltipEl.innerHTML = `<div>${tooltipText}</div>`;

          // Position the tooltip
          const position = chart.canvas.getBoundingClientRect();
          tooltipEl.style.left = `${position.left + window.pageXOffset + hoveredTotal.x}px`;
          tooltipEl.style.top = `${position.top + window.pageYOffset + hoveredTotal.y - 40}px`;
        } else {
          tooltipEl.style.opacity = '0';
        }
      };

      const handleMouseOut = () => {
        tooltipEl.style.opacity = '0';
      };

      chart.canvas.addEventListener('mousemove', handleMouseMove);
      chart.canvas.addEventListener('mouseout', handleMouseOut);

      // Clean up event listeners when plugin is destroyed
      chart._totalTooltipListeners = {
        mousemove: handleMouseMove,
        mouseout: handleMouseOut
      };
    },

    // Cleanup when chart is destroyed
    beforeDestroy(chart: any) {
      if (chart.totalTooltip) {
        chart.totalTooltip.destroy();
      }
      if (chart._totalTooltipListeners) {
        chart.canvas.removeEventListener('mousemove', chart._totalTooltipListeners.mousemove);
        chart.canvas.removeEventListener('mouseout', chart._totalTooltipListeners.mouseout);
      }
    }
  };


  const data = useMemo(() => chartData({ ...props, metrics: metrics.map((m, i) => ({ ...m, title: translatedMetrics[i] })) }), [props, translatedMetrics]);


  return (
    <Chart
      type="bar"
      height="100%"
      options={{
        ...options,
        plugins: {
          ...options.plugins,
          stackedTotalPlugin: {
            AbsolutePercentage: props.AbsolutePercentage,
            KPIvalue: props.KPIvalue,
            stackMetrics: props.stackMetrics// Or false based on your condition
          },
          totalSeparator: {
            enabled: props.TotalStores
          },
          stringMetric: {
            enabled: (props.performance && !props.stackMetrics) || props.optimization,
            metrics: metrics,
            rawData: props.results?.data || []
          }
        }
      }}
      data={data}
      plugins={props.stackMetrics ? [StackedTotalPlugin] : []}
    />
  );



}

/********************************************************************
 * HELPERS
 ********************************************************************/
function formatToWeekLabel(date: Date, performance: boolean, stackMetrics: boolean): string {
  const target = new Date(date); // Clone the input date
  const day = target.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Calculate ISO weekday (Monday = 1, Sunday = 7)
  const isoDay = day === 0 ? 7 : day;

  // Get Monday of the current week
  const monday = new Date(target);
  monday.setDate(target.getDate() - isoDay + 1);

  // Calculate ISO week number
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3); // ISO week is the week with Thursday

  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstThursdayDay = firstThursday.getDay();
  const firstISOWeekStart = new Date(firstThursday);
  firstISOWeekStart.setDate(firstThursday.getDate() - (firstThursdayDay === 0 ? 6 : firstThursdayDay - 1));

  const weekNumber = Math.round(
    ((monday.getTime() - firstISOWeekStart.getTime()) / 86400000) / 7 + 1
  );

  const mondayFormatted = monday.toISOString().split('T')[0];

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayFormatted = sunday.toISOString().split('T')[0];

  if (performance && !stackMetrics) {
    return `Week ${weekNumber} ${mondayFormatted} ${sundayFormatted}`;
  } else {
    return `Week ${weekNumber}`;
  }
}




/********************************************************************
 * DATA TRANSFORM
 ********************************************************************/


function chartData(props: Props): ChartData<'bar' | 'line'> {
  const {
    results,
    xAxis,
    metrics,
    granularity,
    lineMetrics,
    AbsolutePercentage,
    showSecondYAxis,
    TotalStores,
    round,
    PercentageSign,
    Totalperformance,
    performance,
    KPIvalue,
    stackMetrics

  } = props;

  const roundValue = (v: number) => (round ? Math.round(v) : v);

  if (!results?.data) return { labels: [], datasets: [] };

  const labels: string[] = [];
  /** perMetric[metricIndex][labelIndex] = value */
  const perMetric: number[][] = metrics.map(() => []);

  /** helper to ensure label uniqueness + index lookup */
  const getLabelIndex = (lbl: string) => {
    let idx = labels.indexOf(lbl);
    if (idx === -1) {
      labels.push(lbl);
      perMetric.forEach((arr) => arr.push(0));
      idx = labels.length - 1;
    }
    return idx;
  };


  let selectedMetrics = metrics;
  if (performance && !stackMetrics) {
    selectedMetrics = metrics.slice(0, 2);
  }

  if (Totalperformance) {
    selectedMetrics = metrics.slice(0, 2);
  }

  if (KPIvalue?.includes('Units of Sales')) {
    selectedMetrics = metrics.slice(0, 2);  // Return first two metrics
  } else if (KPIvalue?.includes('Sales in CLP$')) {
    selectedMetrics = metrics.slice(2, 4);  // Return next two metrics
  }
  else if (KPIvalue?.includes('Conversion Rate')) {
    selectedMetrics = metrics.slice(0, 2);  // Return next two metrics
  }
  else if (KPIvalue?.includes('Average Basket Size')) {
    selectedMetrics = metrics.slice(2, 4);  // Return next two metrics
  }
  else if (KPIvalue?.includes('Sales Uplift')) {
    selectedMetrics = metrics.slice(4, 5);  // Return next two metrics
  }
  else if (KPIvalue?.includes('Conversion Uplift')) {
    selectedMetrics = metrics.slice(5, 6);  // Return next two metrics
  }

  // ---- GROUPING LOGIC ---- //
  const pushValue = (metricIdx: number, label: string, value: number) => {
    const li = getLabelIndex(label);
    perMetric[metricIdx][li] += value;
  };

  results.data.forEach((entry) => {
    const rawDate = new Date(entry[xAxis.name]);

    selectedMetrics.forEach((metric, mi) => {
      const val = +entry[metric.name] || 0;
      //if (val === 0) return;

      let label = '';
      switch (granularity) {
        case 'day':
          label = rawDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(',', '');
          break;
        case 'week':
          label = formatToWeekLabel(rawDate, performance, stackMetrics);
          break;
        case 'month':
          label = rawDate.toLocaleString('en-US', { month: 'long' });
          break;
        case 'hour':
          {
            const h = rawDate.getHours();
            if (h < 8 || h > 21) return;
            label = `${h}`;
          }
          break;
        case 'hour_group':
          {
            const h = rawDate.getHours();
            if (h < 8 || h > 21) return;
            if (h <= 10) label = '8:00 - 10:59';
            else if (h <= 12) label = '11:00 - 12:59';
            else if (h <= 14) label = '13:00 - 14:59';
            else if (h <= 16) label = '15:00 - 16:59';
            else if (h <= 18) label = '17:00 - 18:59';
            else label = '19:00 - 21:59';
          }
          break;
        case 'total':
          {
            const h = rawDate.getHours();
            if (h < 8 || h > 21) return;
            const date = rawDate.toISOString().slice(0, 10);
            const hr = h.toString().padStart(2, '0');
            label = `${date} ${hr}`;
          }
          break;

        default:
          label = formatValue(entry[xAxis.name] ?? '', {
            meta: xAxis.meta,
            dateFormat: DATE_DISPLAY_FORMATS[granularity ?? ''],
          });
      }

      pushValue(mi, label, val);
    });
  });

  /* ---------- FIX hour label order (8 → 21) ------------------------ */
  if (granularity === 'hour') {
    // 1. build an array of {hour,labelIdx}
    const hourIndexPairs = labels.map((h, i) => ({ hour: +h, idx: i }));

    // 2. sort by hour ascending
    hourIndexPairs.sort((a, b) => b.hour - a.hour);

    // 3. create new ordered label list
    const orderedLabels = hourIndexPairs.map(p => String(p.hour));

    // 4. create new per‑metric arrays in that same order
    perMetric.forEach((row, mi) => {
      const reordered = hourIndexPairs.map(p => row[p.idx]);
      perMetric[mi] = reordered;
    });

    // 5. replace labels in‑place
    labels.splice(0, labels.length, ...orderedLabels);
  }
  /* ---------------------------------------------------------------- */

  /* ---------- FIX hour‑group label order --------------------------- */
  if ((granularity === 'hour_group')) {
    // desired fixed sequence
    const desired = [
      '8:00 - 10:59',
      '11:00 - 12:59',
      '13:00 - 14:59',
      '15:00 - 16:59',
      '17:00 - 18:59',
      '19:00 - 21:59',
    ];

    // build map from label → original index
    const idxMap: Record<string, number> = {};
    labels.forEach((lbl, i) => (idxMap[lbl] = i));

    // new ordered labels – keep only those that actually exist
    // new ordered labels – keep only those that actually exist, then REVERSE
    const orderedLabels = desired
      .filter((lbl) => lbl in idxMap)
      .reverse();                    // ⬅️ inverse order

    // reorder each metric’s data to match new label order
    perMetric.forEach((row, mi) => {
      const reordered = orderedLabels.map((lbl) => row[idxMap[lbl]]);
      perMetric[mi] = reordered;
    });

    // replace labels in place
    labels.splice(0, labels.length, ...orderedLabels);

  }

  /**if ((xAxis.name === 'big_dm.hour_group')) {
    // desired fixed sequence
    const desired = [
      '8:00-10:59',
      '11:00-12:59',
      '13:00-14:59',
      '15:00-16:59',
      '17:00-18:59',
      '19:00-21:59',
    ];

    // build map from label → original index
    const idxMap: Record<string, number> = {};
    labels.forEach((lbl, i) => (idxMap[lbl] = i));

    // new ordered labels – keep only those that actually exist
    // new ordered labels – keep only those that actually exist, then REVERSE
    const orderedLabels = desired
      .filter((lbl) => lbl in idxMap)                  // ⬅️ inverse order

    // reorder each metric’s data to match new label order
    perMetric.forEach((row, mi) => {
      const reordered = orderedLabels.map((lbl) => row[idxMap[lbl]]);
      perMetric[mi] = reordered;
    });

    // replace labels in place
    labels.splice(0, labels.length, ...orderedLabels);

  }*/



  /* ---------------------------------------------------------------- */



  // ---- DATASETS ---- //
  const defaultRamp = ['#888888', '#aaaaaa', '#bbbbbb'];
  const palette: string[] = (() => {
    if (selectedMetrics.length > 1) return ['#62626e', '#f04b55', ...defaultRamp];
    return ['#f04b55', ...defaultRamp];
  })();

  const buildBarDataset = (metricIndex: number) => {
    let data = perMetric[metricIndex].map(roundValue);

    if (TotalStores) {
      // Sum the original values without rounding first
      const total = perMetric[metricIndex].reduce((sum, value) => sum + value, 0);
      // Only round the final total
      data = [...data, roundValue(total)];
    }

    const baseColor = palette[metricIndex] ?? palette[palette.length - 1];

    // Define the hover color mapping
    const hoverColorMap: Record<string, string> = {
      '#f04b55': '#af3241',
      '#62626e': '#2d2d37',
    };

    return {
      barPercentage: 0.8,
      barThickness: 'flex',

      maxBarThickness: 200,
      minBarLength: 0,
      borderRadius: 6,
      label: selectedMetrics[metricIndex].title,
      data,
      backgroundColor: baseColor,
      hoverBackgroundColor: hoverColorMap[baseColor.toLowerCase()] ?? baseColor,
      borderColor: palette[metricIndex] ?? palette[palette.length - 1],
      order: 1,
    } as const;
  };

  const barDatasets = selectedMetrics.map((_, i) => buildBarDataset(i));

  const lineDatasets = (lineMetrics || []).map((metric) => {
    const idx = selectedMetrics.findIndex((m) => m.name === metric.name);
    const dsData = idx !== -1 ? perMetric[idx] : labels.map(() => 0);
    return {
      label: metric.title,
      data: dsData.map(roundValue),
      backgroundColor: '#a53241',
      borderColor: '#a53241',
      cubicInterpolationMode: 'monotone' as const,
      pointRadius: 2,
      pointHoverRadius: 3,
      type: 'line' as const,
      order: 0,
      Stack: true,
      yAxisID: showSecondYAxis ? 'y1' : 'y',
    } as const;
  });

  let datasets = [...barDatasets, ...lineDatasets];

  if (AbsolutePercentage) {
    if (selectedMetrics.length <= 1) {
      // ---------- previous global‑total behaviour ---------- //
      const globalTotal = labels.reduce(
        (tot, _lbl, i) =>
          tot + datasets.reduce((s, ds) => s + (+ds.data[i] || 0), 0),
        0,
      );
      if (globalTotal !== 0) {
        datasets.forEach((ds) => {
          ds.data = ds.data.map((v) => ((+v / globalTotal) * 100));
        });
      }
    } else {
      // ---------- NEW per‑label behaviour ------------------ //
      labels.forEach((_lbl, li) => {
        const labelTotal = datasets.reduce((s, ds) => s + (+ds.data[li] || 0), 0);
        if (labelTotal === 0) return;
        datasets.forEach((ds) => {
          ds.data[li] = (+ds.data[li] / labelTotal) * 100;
        });
      });
    }
  }

  if (TotalStores) labels.push('Total');

  return { labels, datasets };
}
