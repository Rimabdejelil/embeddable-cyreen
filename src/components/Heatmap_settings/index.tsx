import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Dimension, Measure, Dataset } from '@embeddable.com/core';
import { DataResponse } from '@embeddable.com/core';
import Loading from '../util/Loading';
import Error from '../util/Error';
import DownloadMenu from '../vanilla/DownloadMenu';

type Props = {
    ds: Dataset;
    xDim: Dimension;
    yDim: Dimension;
    valueMeasure: Measure;
    results: DataResponse;
    AbsolutePercentage?: boolean;
    InstoreDurationEdeka?: boolean;
    InstoreDurationUnimarc?: boolean;
    title?: string;
    enableDownloadAsPNG?: boolean;
    enableDownloadAsCSV?: boolean;
    edeka?: boolean;
    KPIvalue?: string;
    Despar?: boolean;
};

export default (props: Props) => {
    const {
        xDim,
        yDim,
        valueMeasure,
        results,
        AbsolutePercentage,
        InstoreDurationEdeka,
        InstoreDurationUnimarc,
        title,
        enableDownloadAsCSV,
        enableDownloadAsPNG,
        edeka,
        KPIvalue,
        Despar
    } = props;
    const { isLoading, data, error } = results;
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null); // Add a ref for the container
    const refExportPNGElement = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [preppingDownload, setPreppingDownload] = useState(false); // Add state for download preparation
    const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    /* ------------------------------------------------------------ */
    /*  Tooltip – create once                                        */
    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    /*  Tooltip – create once and clean up                          */
    /* ------------------------------------------------------------ */
    useEffect(() => {
        const tooltipNode = d3
            .select('body')
            .append('div')
            .attr('id', 'heatmap-tooltip')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('z-index', '9999')
            .style('background-color', 'rgb(255,255,255)')
            .style('color', 'black')
            .style('padding', '8px')
            .style('font-family', 'Arial, sans-serif')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .node() as HTMLDivElement;

        tooltipRef.current = tooltipNode;

        return () => {
            // 🔑 cleanup on unmount
            d3.select('#heatmap-tooltip').remove();
            tooltipRef.current = null;
        };
    }, []);


    const tooltip = d3.select(tooltipRef.current!);

    /* ------------------------------------------------------------ */
    /*  Maps & helpers                                               */
    /* ------------------------------------------------------------ */
    const impressionsMapping: Record<string, string> = {
        'impressions.weekday': 'Weekday',
        'impressions.name_store': 'Store Name',
        'impressions.hour': 'Hour',
        'impressions.hour_group': 'Hour Group',
        'impressions.week': 'Week',
        'impressions.month': 'Month',
        'impressions.id_campaign': 'Total',
        'customer_journeys.hour': 'Hour',
        'customer_journeys.hour_group': 'Hour Group',
        'customer_journeys.month': 'Month',
        'customer_journeys.weekday': 'Weekday',

    };

    const weekday = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];
    const getDayLabel = (v: string | number, dim: Dimension) => {
        const idx = +v;
        if (dim === 'impressions.weekday' || dim === 'customer_journeys.weekday') {
            if (idx >= 1 && idx <= 7) return weekday[idx - 1];
        }
        return v;
    };

    /* ------------------------------------------------------------ */
    /*  Resize observer                                              */
    /* ------------------------------------------------------------ */
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const { clientWidth: width, clientHeight: height } = containerRef.current;
            setSize({ width, height });
        };

        // Initial size update
        updateSize();

        // Debounced resize handler
        const debouncedUpdateSize = debounce(updateSize, 100);
        window.addEventListener('resize', debouncedUpdateSize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', debouncedUpdateSize);
        };
    }, []);

    /* ------------------------------------------------------------ */
    /*  Global tooltip‑hide listeners                                */
    /* ------------------------------------------------------------ */
    useEffect(() => {
        const hide = () => tooltip.style('visibility', 'hidden');
        const keyHide = (e: KeyboardEvent) => e.key === 'Escape' && hide();
        document.addEventListener('mousedown', hide);
        document.addEventListener('wheel', hide, { passive: true });
        document.addEventListener('keydown', keyHide);
        return () => {
            document.removeEventListener('mousedown', hide);
            document.removeEventListener('wheel', hide);
            document.removeEventListener('keydown', keyHide);
        };
    }, [tooltip]);

    /* ------------------------------------------------------------ */
    /*  NEW ordering helpers                                         */
    /* ------------------------------------------------------------ */
    // ⬅️ NEW / CHANGED
    /* ------------------------------------------------------------ */
    /*  Robust ordering helpers                                     */
    /* ------------------------------------------------------------ */
    const hourGroupOrder = [
        '8:00 - 10:59',
        '11:00 - 12:59',
        '13:00 - 14:59',
        '15:00 - 16:59',
        '17:00 - 18:59',
        '19:00 - 21:59',
    ];

    const hourGroupOrder2 = [
        '8:00-10:59',  // Alternative formats
        '8:30-10:59',
        '11:00-12:59',
        '13:00-14:59',
        '15:00-16:59',
        '17:00-18:59',
        '19:00-21:30',
        '19:00-22:00'
    ];


    const hourGroupOrder3 = [
        '7-10',
        '10-12',
        '12-15',
        '15-18',
        '18-22'
    ];

    // Choose which hour group order to use based on InstoreDuration prop
    const activeHourGroupOrder = InstoreDurationUnimarc ? hourGroupOrder2 : edeka ? hourGroupOrder3 : hourGroupOrder;

    /** normalise "8:00‑10:59" / extra spaces / lower‑case → "8:00 - 10:59" */
    const normHourLabel = (s: string) =>
        s.replace(/\s*-\s*/, ' - ').replace(/\s+/g, ' ').trim();

    const hourRank = Object.fromEntries(
        activeHourGroupOrder.map((h, i) => [normHourLabel(h), i]),
    ); // { '8:00 - 10:59':0, … }

    /** same idea for months */
    const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthRank = Object.fromEntries(monthOrder.map((m, i) => [m, i]));

    /** master compare‑function */
    const dimSorter = (dim: Dimension) => {
        if (dim === 'impressions.hour_group' || dim === 'customer_journeys.hour_group') {
            return (a: string, b: string) => {
                const ra = hourRank[normHourLabel(a)];
                const rb = hourRank[normHourLabel(b)];
                return ra !== undefined && rb !== undefined
                    ? ra - rb
                    : d3.ascending(a, b);          // fallback if one is unknown
            };
        }
        if (dim === 'impressions.month' || dim === 'customer_journeys.month') {
            return (a: string, b: string) => monthRank[a] - monthRank[b];
        }
        if (dim === 'impressions.weekday' || dim === 'customer_journeys.weekday') {
            return (a: any, b: any) => +a - +b; // 0–6
        }
        // numeric if both numbers, else alpha
        return (a: any, b: any) =>
            !isNaN(+a) && !isNaN(+b) ? +a - +b : d3.ascending(a, b);
    };

    /* ------------------------------------------------------------ */

    /* ------------------------------------------------------------ */
    /*  Main draw                                                    */
    /* ------------------------------------------------------------ */
    const formatNumber = d3.format(','); // formats numbers with commas

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // --- normalise data ----------------------------------------
        const norm = data.map((d) => {
            const r: any = { ...d };
            if (xDim === 'impressions.id_campaign') r[xDim] = 'Total';
            if (yDim === 'impressions.id_campaign') r[yDim] = 'Total';
            return r;
        });

        // --- layout sizes ------------------------------------------
        const container = svgRef.current?.parentElement;
        const fullWidth = container?.clientWidth || 1000;
        const fullHeight = container?.clientHeight || 400;

        const margin = {
            top: 80,
            right: 15,
            bottom: 15,
            left: 100,
        };

        const width = fullWidth - margin.left - margin.right;
        const height = fullHeight - margin.top - margin.bottom;



        const svg = d3
            .select(svgRef.current)
            .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', '100%');

        // Add heatmap title to top-left



        svg.selectAll('*').remove();


        const g = d3
            .select(svgRef.current)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // --- filters ------------------------------------------------
        const filtered = norm.filter((d) => {
            const xVal = d[xDim];
            const yVal = d[yDim];
            const closedX = (xDim === 'impressions.hour_group' || xDim === 'customer_journeys.hour_group') && xVal === 'Closed';
            const closedY = (yDim === 'impressions.hour_group' || yDim === 'customer_journeys.hour_group') && yVal === 'Closed';
            return xVal != null && yVal != null && !closedX && !closedY;
        });

        const total = d3.sum(filtered, (d) => +d[valueMeasure] || 0);

        // --- unique values with NEW sort ----------------------------
        // ⬅️ NEW / CHANGED
        const xValsSet = new Set<string>();
        const yValsSet = new Set<string>();
        for (const d of filtered) {
            xValsSet.add(d[xDim]);
            yValsSet.add(d[yDim]);
        }
        const xVals = [...xValsSet].sort(dimSorter(xDim));
        const yVals = [...yValsSet].sort(dimSorter(yDim));

        // --- scales -------------------------------------------------
        const xScale = d3.scaleBand<string>().domain(xVals).range([0, width]);
        const yScale = d3.scaleBand<string>().domain(yVals).range([0, height]);
        // Replace the colorScale definition with this:
        // Replace the colorScale definition with this:
        const minValue = d3.min(filtered, (d) => +d[valueMeasure]) || 0;
        const maxValue = d3.max(filtered, (d) => +d[valueMeasure]) || 1;
        const valueRange = maxValue - minValue;

        // For InstoreDuration, we'll focus the color scale on the actual data range
        const colorScale = (InstoreDurationUnimarc || InstoreDurationEdeka)
            ? d3.scaleLinear<string>()
                .domain([
                    minValue - (valueRange * 0.1),  // Extend slightly below min
                    maxValue + (valueRange * 0.1)   // Extend slightly above max
                ])
                .range(['#fcd5d9', '#f04b55'])  // Lightest to darkest red
            : d3.scaleLinear<string>()
                .domain([0, maxValue])
                .range(['#fcd5d9', '#f04b55']);

        // --- axes labels -------------------------------------------
        g.append('g')
            .selectAll('text')
            .data(xVals)
            .enter()
            .append('text')
            .attr('x', (d) => xScale(d)! + xScale.bandwidth() / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font', '13px Arial, sans-serif')
            .text((d) => getDayLabel(d, xDim));

        g.append('g')
            .selectAll('text')
            .data(yVals)
            .enter()
            .append('text')
            .attr('x', -45)
            .attr('y', (d) => yScale(d)! + yScale.bandwidth() / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('font', '13px Arial, sans-serif')
            .text((d) => getDayLabel(d, yDim));

        // --- cells --------------------------------------------------

        svg.append('text')
            .attr('x', -16) // a bit of padding from the left edge
            .attr('y', 20) // a bit of padding from the top edge
            .attr('text-anchor', 'start')
            .style('fill', '#AF3241')
            .style('font-size', '25px')
            .style('font-family', 'Arial, sans-serif')
            .text('Heatmap');



        const cells = g
            .selectAll('rect')
            .data(filtered)
            .enter()
            .append('rect')
            .attr('x', (d) => xScale(d[xDim])!)
            .attr('y', (d) => yScale(d[yDim])!)
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', (d) => {
                const val = +d[valueMeasure];
                // For InstoreDuration, we'll ensure the value is within our focused domain
                return colorScale((InstoreDurationUnimarc || InstoreDurationEdeka) ? Math.max(minValue - (valueRange * 0.1), Math.min(val, maxValue + (valueRange * 0.1))) : val);
            })
            .attr('stroke', '#fff');

        cells
            .on('mouseover', (e, d: any) => {
                const xL = getDayLabel(d[xDim], xDim);
                const yL = getDayLabel(d[yDim], yDim);
                const formattedValue = (+d[valueMeasure]).toLocaleString(Despar ? 'de-DE' : 'en-US');

                const value = AbsolutePercentage
                    ? `${Math.round((+d[valueMeasure] / total) * 100)}%`
                    : (+d[valueMeasure]).toLocaleString(Despar ? 'de-DE' : 'en-US');


                if (['Sales (Units)', 'Revenue (€)', 'Revenue (CLP$))', 'Shoppers (Amount)', 'Duration (Min.)'].includes(KPIvalue || '')) {
                    tooltip
                        .style('visibility', 'visible')
                        .html(
                            `The ${KPIvalue} is <strong style="color:#AF3241">${formattedValue}</strong> during ${impressionsMapping[xDim]} <strong style="color:#AF3241">${xL}</strong> and ${impressionsMapping[yDim]} <strong style="color:#AF3241">${yL}</strong>.`
                        );
                }

                else if (xDim.includes("customer_journeys") && !KPIvalue) {
                    tooltip
                        .style('visibility', 'visible')
                        .html(
                            `<strong style="color:#AF3241">${d[valueMeasure]}</strong> minutes is the average in-store shopping duration during  ` +
                            `${impressionsMapping[xDim]} <strong style="color:#AF3241">${xL}</strong> and ` +
                            `${impressionsMapping[yDim]} <strong style="color:#AF3241">${yL}</strong>.`
                        );
                } else {
                    tooltip
                        .style('visibility', 'visible')
                        .html(
                            `During ${impressionsMapping[xDim]} <strong style="color:#AF3241">${xL}</strong> and ` +
                            `${impressionsMapping[yDim]} <strong style="color:#AF3241">${yL}</strong>, ` +
                            `Impressions are <strong style="color:#AF3241">${value}</strong>`
                        );
                }
            })
            .on('mousemove', (e) => {
                // Get tooltip dimensions
                const tooltipNode = tooltipRef.current;
                if (!tooltipNode) return;

                const tooltipRect = tooltipNode.getBoundingClientRect();
                const tooltipWidth = tooltipRect.width;
                const tooltipHeight = tooltipRect.height;

                // Calculate mouse position
                const mouseX = e.pageX;
                const mouseY = e.pageY;

                // Calculate window dimensions
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // Calculate potential positions
                const rightSpace = windowWidth - mouseX;
                const leftSpace = mouseX;
                const bottomSpace = windowHeight - mouseY;
                const topSpace = mouseY;

                // Determine horizontal position
                let leftPos = mouseX + 5; // Default to right of cursor
                if (rightSpace < tooltipWidth && leftSpace > tooltipWidth) {
                    leftPos = mouseX - tooltipWidth - 5; // Show to left if not enough space on right
                }

                // Determine vertical position
                let topPos = mouseY + 5; // Default to below cursor
                if (bottomSpace < tooltipHeight && topSpace > tooltipHeight) {
                    topPos = mouseY - tooltipHeight - 5; // Show above if not enough space below
                }

                // Apply positions
                tooltip
                    .style('top', `${topPos}px`)
                    .style('left', `${leftPos}px`);
            })
            .on('mouseleave', () => tooltip.style('visibility', 'hidden'));

        // --- cell text ---------------------------------------------
        const fmt = new Intl.NumberFormat();
        g.selectAll('text.cell-val')
            .data(filtered)
            .enter()
            .append('text')
            .attr('class', 'cell-val')
            .attr('x', (d) => xScale(d[xDim])! + xScale.bandwidth() / 2)
            .attr('y', (d) => yScale(d[yDim])! + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('font', '13px Arial, sans-serif')
            .style('fill', (d) =>
                d3.hsl(colorScale(+d[valueMeasure])).l > 0.6 ? 'black' : 'white'
            )
            .text((d) => {
                const v = +d[valueMeasure];
                if (isNaN(v)) return '';

                if (AbsolutePercentage) {
                    return `${Math.round((v / total) * 100)}%`;
                }

                // If more than 6 digits, convert to K
                if (v >= 1_000_000) {
                    return `${Math.round(v / 1000).toLocaleString(Despar ? 'de-DE' : 'en-US')}K`;

                }

                return Despar ? v.toLocaleString('de-DE') : v.toLocaleString('en-US');

            });

    }, [data, xDim, yDim, valueMeasure, size, AbsolutePercentage]);

    if (isLoading) return <Loading />;
    if (error) return <Error msg={error} />;

    console.log("Container height", svgRef.current?.parentElement?.clientHeight);

    // Wrap the SVG inside a div with the same container styling
    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px', // Add minimum height
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                padding: '15px', // Increased padding from 8px to 15px to match matrix
                borderRadius: '8px',
                border: '1px solid #ccc',
                position: 'relative', // Add relative positioning
            }}
        >
            {/* Add DownloadMenu component with proper positioning */}
            {(enableDownloadAsCSV || enableDownloadAsPNG) && (
                <div style={{
                    position: 'absolute',
                    top: '15px', // Matches matrix component
                    right: '15px', // Matches matrix component
                    zIndex: 1000,
                    backgroundColor: 'transparent',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    outline: 'none'
                }}>
                    <DownloadMenu
                        csvOpts={{
                            chartName: props.title || 'heatmap',
                            props: {
                                ...props,
                                results: results,
                            },
                        }}
                        enableDownloadAsCSV={enableDownloadAsCSV}
                        enableDownloadAsPNG={enableDownloadAsPNG}
                        pngOpts={{ chartName: props.title || 'chart', element: svgRef.current }}
                        preppingDownload={preppingDownload}
                        setPreppingDownload={setPreppingDownload}
                    />
                </div>
            )}

            <svg
                ref={svgRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block', // Ensure block display
                }}
                preserveAspectRatio="xMidYMid meet"
            />
        </div>
    );

};

