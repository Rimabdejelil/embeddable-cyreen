import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Dimension, Measure, Dataset } from "@embeddable.com/core";
import { DataResponse } from "@embeddable.com/core";
import Loading from '../util/Loading';
import Error from '../util/Error';

type Props = {
    ds: Dataset;
    xDim: Dimension; // X axis dimension
    yDim: Dimension; // Y axis dimension
    valueMeasure: Measure; // Values (measure) for the heatmap cells
    results: DataResponse; // { isLoading, error, data: [{ <name>: <value>, ... }] }
};

const HeatmapComponent = (props: Props) => {
    const { xDim, yDim, valueMeasure, results } = props;
    const { isLoading, data, error } = results;
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [size, setSize] = useState({ width: 800, height: 600 }); // Default size

    // Resize the heatmap based on the container's size
    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Set up the SVG container
        const margin = { top: 40, right: 20, bottom: 40, left: 80 };
        const { width, height } = size;

        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Filter out data where x and y are both 0
        const filteredData = data.filter(d => d[xDim] !== 0 && d[xDim] !== "0" && d[yDim] !== 0 && d[yDim] !== "0");

        // Sort the x and y values (ensure order for days or months)
        const xValues = Array.from(new Set(filteredData.map(d => d[xDim]))).sort((a, b) => a - b);
        const yValues = Array.from(new Set(filteredData.map(d => d[yDim]))).sort((a, b) => a - b);

        const xScale = d3.scaleBand()
            .domain(xValues)
            .range([0, width])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(yValues)
            .range([0, height])
            .padding(0.05);

        // Prepare color scale for the values
        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d[valueMeasure])])
            .range([d3.rgb('#fcd5d9'), d3.rgb('#f04b55')]); // From light red to your specified red color

        // Create X axis labels above the heatmap with adjusted gap
        svg.append('g')
            .selectAll('.x-axis')
            .data(xValues)
            .enter().append('text')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', -5) // Positioning the X-axis closer to the heatmap
            .attr('text-anchor', 'middle')
            .text(d => d)
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif');

        // Append Y axis labels with a margin to the left of the Y-axis
        svg.append('g')
            .selectAll('.y-axis')
            .data(yValues)
            .enter().append('text')
            .attr('x', -30) // Positioning the Y-axis with a slight margin to the left
            .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(d => d)
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif');

        // Create heatmap cells and add text inside each cell
        svg.selectAll('.cell')
            .data(filteredData)
            .enter().append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d[xDim]))
            .attr('y', d => yScale(d[yDim]))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d[valueMeasure]))
            .attr('stroke', '#fff');

        // Format numbers with commas for thousands
        const formatNumber = new Intl.NumberFormat();

        // Add text inside the heatmap cells with color adjustment based on intensity
        svg.selectAll('.cell-text')
            .data(filteredData)
            .enter().append('text')
            .attr('class', 'cell-text')
            .attr('x', d => xScale(d[xDim]) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d[yDim]) + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')  // Centers the text vertically
            .style('font-size', '10px') // Reduced font size for better fitting
            .style('font-family', 'Arial, sans-serif')
            .style('fill', d => {
                const cellColor = colorScale(d[valueMeasure]);
                const rgb = d3.rgb(cellColor);
                const brightness = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b; // Calculate brightness using the luminance formula
                return brightness > 128 ? 'black' : 'white'; // Choose black or white based on brightness
            })
            .text(d => {
                const value = parseFloat(d[valueMeasure]);
                return !isNaN(value) ? formatNumber.format(value) : ''; // Safely format the value with commas
            });

    }, [data, xDim, yDim, valueMeasure, size]); // Re-render when size changes


    if (isLoading) {
        return <Loading />;
    }
    if (error) {
        return <Error msg={error} />;
    }

    return <svg ref={svgRef}></svg>;
};

export default HeatmapComponent;
