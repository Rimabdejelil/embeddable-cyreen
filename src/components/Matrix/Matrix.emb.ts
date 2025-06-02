import { EmbeddedComponentMeta, Inputs, defineComponent } from '@embeddable.com/react';
import { Dataset, Dimension, Measure, loadData } from '@embeddable.com/core';

import MatrixChartEcharts from './index'; // Import your matrix chart component

export const meta = {
    name: 'Matrix',
    label: 'Matrix Chart',
    classNames: ['add-border'],
    inputs: [
        {
            name: 'ds',
            type: 'dataset',
            label: 'Dataset to display',
            category: 'Configure chart',
        },
        {
            name: 'xMeasures',
            type: 'measure',
            label: 'X Axis Measure',
            config: {
                dataset: 'ds',
            },
            category: 'Configure chart',
            array: true
        },
        {
            name: 'yMeasures',
            type: 'measure',
            label: 'Y Axis Measure',
            config: {
                dataset: 'ds',
            },
            category: 'Configure chart',
            array: true
        },
        {
            name: 'matrixValue',
            type: 'dimension',
            label: 'Matrix Values (Dimension)',
            config: {
                dataset: 'ds',
            },
            category: 'Configure chart',
        },
        {
            name: 'xAxisTitle',
            type: 'string',
            label: 'X-Axis Title',
            category: 'Chart settings',
        },
        {
            name: 'yAxisTitle',
            type: 'string',
            label: 'Y-Axis Title',
            category: 'Chart settings',
        },
        {
            name: 'MatrixKPIvalue',
            type: 'string',
            label: 'KPI value',
            category: 'Chart settings',
        },
    ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(MatrixChartEcharts, meta, {
    props: (inputs: Inputs<typeof meta>) => {
        return {
            ...inputs,
            results: loadData({
                from: inputs.ds,
                dimensions: [inputs.matrixValue],
                measures: [...inputs.xMeasures, ...inputs.yMeasures],
            }),
        };
    },
});
