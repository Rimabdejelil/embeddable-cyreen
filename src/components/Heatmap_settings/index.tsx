import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Dimension, Measure, Dataset } from '@embeddable.com/core';
import { DataResponse } from '@embeddable.com/core';
import Loading from '../util/Loading';
import Error from '../util/Error';

type Props = {
    ds: Dataset;
    xDim: Dimension;
    yDim: Dimension;
    valueMeasure: Measure;
    results: DataResponse;
    AbsolutePercentage?: boolean;
};

const HeatmapComponent = ({
    xDim,
    yDim,
    valueMeasure,
    results,
    AbsolutePercentage,
}: Props) => {
    const { isLoading, data, error } = results;
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 1000, height: 400 });

    /* ------------------------------------------------------------ */
    /*  Tooltip – create once                                        */
    /* ------------------------------------------------------------ */
    useEffect(() => {
        if (!tooltipRef.current) {
            tooltipRef.current = d3
                .select('body')
                .append('div')
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
        }
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
        const handleResize = () => {
            if (!svgRef.current?.parentElement) return;
            const { offsetWidth: width, offsetHeight: height } =
                svgRef.current.parentElement;
            setSize({ width: width || 1000, height: height || 400 });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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

    /** normalise "8:00‑10:59" / extra spaces / lower‑case → "8:00 - 10:59" */
    const normHourLabel = (s: string) =>
        s.replace(/\s*-\s*/, ' - ').replace(/\s+/g, ' ').trim();

    const hourRank = Object.fromEntries(
        hourGroupOrder.map((h, i) => [normHourLabel(h), i]),
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
        const colorScale = d3
            .scaleLinear<number, string>()
            .domain([0, d3.max(filtered, (d) => +d[valueMeasure]) || 0])
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
            .attr('x', 10) // a bit of padding from the left edge
            .attr('y', 30) // a bit of padding from the top edge
            .attr('text-anchor', 'start')
            .style('fill', '#a53241')
            .style('font-size', '23px')
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
            .attr('fill', (d) => colorScale(+d[valueMeasure]))
            .attr('stroke', '#fff');

        cells
            .on('mouseover', (e, d: any) => {
                const xL = getDayLabel(d[xDim], xDim);
                const yL = getDayLabel(d[yDim], yDim);

                if (xDim.includes("customer_journeys")) {
                    tooltip
                        .style('visibility', 'visible')
                        .html(
                            `<strong style="color:#a53241">${d[valueMeasure]}</strong> minutes is the Average Duration in-store shopping duration during ` +
                            `${impressionsMapping[xDim]} <strong style="color:#a53241">${xL}</strong> and ` +
                            `${impressionsMapping[yDim]} <strong style="color:#a53241">${yL}</strong>.`
                        );
                } else {
                    tooltip
                        .style('visibility', 'visible')
                        .html(
                            `During ${impressionsMapping[xDim]} <strong style="color:#a53241">${xL}</strong> and ` +
                            `${impressionsMapping[yDim]} <strong style="color:#a53241">${yL}</strong>, ` +
                            `Impressions are <strong style="color:#a53241">${d3.format(',')(d[valueMeasure])}</strong>`
                        );
                }
            })

            .on('mousemove', (e) =>
                tooltip
                    .style('top', `${e.pageY + 5}px`)
                    .style('left', `${e.pageX + 5}px`)
            )
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
                return AbsolutePercentage
                    ? `${((v / total) * 100).toFixed(1)}%`
                    : d3.format(',')(v);
            });
    }, [data, xDim, yDim, valueMeasure, size, AbsolutePercentage]);

    if (isLoading) return <Loading />;
    if (error) return <Error msg={error} />;

    // Wrap the SVG inside a div with the same container styling
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',   // Keep height dynamic if possible
                padding: '8',   // Example padding
                borderRadius: '8px',
                border: '1px solid #ccc', // Added box shadow  // Ensures padding doesn't affect width/height
            }}
        >
            <svg
                ref={svgRef}
                style={{
                    width: '100%',  // Makes SVG responsive to container's width
                    height: '100%',
                    display: 'block', // Scales SVG to maintain aspect ratio
                }}

            />
        </div>
    );

};


export default HeatmapComponent;