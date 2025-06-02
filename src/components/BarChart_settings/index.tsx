import React from "react";
import moment from "moment"; // Import moment.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2'; // Importing Bar chart
import { Dimension, Measure, Dataset, Granularity } from "@embeddable.com/core";
import { DataResponse } from "@embeddable.com/core";
import Loading from "../util/Loading";
import Error from "../util/Error";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const chartOptions = (showLegend: boolean, values: number[]) => {

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Time",
                },
                type: "category",
                ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Value",
                }
            },
        },
    };
};

const chartData = (labels: string[], values: number[]) => ({
    labels,
    datasets: [
        {
            label: "Metric Value",
            data: values,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            fill: true,
        },
    ],
});

type Props = {
    ds: Dataset;
    slice: Dimension; // { name, title }
    metric: Measure; // [{ name, title }]
    results: DataResponse; // { isLoading, error, data: [{ <name>: <value>, ... }] }
    showLegend: boolean;
    granularity: Granularity;
};

export default (props: Props) => {
    console.log("BasicBarComponent.props", props);
    const { slice, metric, showLegend, results, granularity } = props;
    const { isLoading, data, error } = results;

    if (isLoading) {
        return <Loading />;
    }
    if (error) {
        return <Error msg={error} />;
    }

    // Determine the correct field for X-axis based on granularity
    const granularityFieldMap: Record<Granularity, string> = {
        year: `${slice.name}.year`,
        month: `${slice.name}.month`,
        day: `${slice.name}.day`,
        hour: `${slice.name}`, // Assuming time is stored in the `slice.name` for the hour
    };

    const xField = granularityFieldMap[granularity] || slice.name;

    // Aggregate data by summing metric values for each granularity
    const aggregatedData: Record<string, number> = {};

    data?.forEach((d) => {
        const timeUnit = d[xField]; // Get the time value based on granularity
        const metricValue = parseFloat(d[metric.name]) || 0;

        // Sum the metric values for the same time unit (based on granularity)
        if (timeUnit in aggregatedData) {
            aggregatedData[timeUnit] += metricValue;
        } else {
            aggregatedData[timeUnit] = metricValue;
        }
    });

    // Format the time units according to the granularity (using moment.js)
    const formatTimeUnit = (timeUnit: string) => {
        const timestamp = moment(timeUnit); // Convert time unit to moment object
        switch (granularity) {
            case "year":
                return timestamp.format("HH:mm");
            case "month":
                return timestamp.format("MMMM YYYY");
            case "day":
                return timestamp.format("DD MMM YYYY");
            case "hour":
                return timestamp.format("HH:mm");

            default:
                return timeUnit; // Fallback if not a recognized granularity
        }
    };

    // Extract sorted labels and values for the chart
    const labels1 = Object.keys(aggregatedData).sort();
    const labels = Object.keys(aggregatedData).sort().map(formatTimeUnit);
    const values = labels1.map((label) => aggregatedData[label]);

    // Check if values are empty
    if (values.length === 0) {
        return <Error msg="No data available to display." />;
    }

    return <Bar options={chartOptions(showLegend, values)} data={chartData(labels, values)} />;
};
