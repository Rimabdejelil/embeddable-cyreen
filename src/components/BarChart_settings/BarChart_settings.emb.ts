import { EmbeddedComponentMeta, Inputs, defineComponent } from '@embeddable.com/react';
import { Dataset, Dimension, Measure, loadData } from '@embeddable.com/core';
import Component from './index';

export const meta = {
    name: 'BarChart_settings',
    label: 'Bar Chart with settings',
    classNames: ['add-border'],
    inputs: [
        {
            name: 'ds',
            type: 'dataset',
            label: 'Dataset to display',
            category: 'Configure chart',
        },
        {
            name: 'slice',
            type: 'dimension',
            label: 'Slice (e.g., Time)',
            config: {
                dataset: 'ds',
            },
            category: 'Configure chart',
        },
        {
            name: 'metric',
            type: 'measure',
            label: 'Metric',
            config: {
                dataset: 'ds',
            },
            category: 'Configure chart',
        },
        {
            name: 'showLegend',
            type: 'boolean',
            label: 'Turn on the legend',
            category: 'Chart settings',
            defaultValue: true,
        },
        {
            name: 'granularity',
            type: 'granularity', // ✅ Correct type
            label: 'Granularity',
            category: 'Chart settings',
            defaultValue: 'daily',
        },

    ],
} as const satisfies EmbeddedComponentMeta;


export default defineComponent(Component, meta, {
    props: (inputs: Inputs<typeof meta>) => {
        const rowsLimit = 5000;
        return {
            ...inputs,
            results: loadData({
                from: inputs.ds,
                dimensions: [inputs.slice],
                measures: [inputs.metric],
                timeDimensions: [{
                    dimension: inputs.slice.name, // Assuming `slice` is the time dimension
                    granularity: inputs.granularity
                }],
                limit: rowsLimit, // Set the limit of rows here// ✅ Pass granularity to the data query
            }),
        };
    },
});
