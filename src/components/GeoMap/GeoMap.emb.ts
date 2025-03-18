import { EmbeddedComponentMeta, Inputs, defineComponent } from '@embeddable.com/react';
import { Dataset, Dimension, Measure, loadData } from '@embeddable.com/core';
import GeoMap from './index';

export const meta = {
    name: 'GeoMap',
    label: 'Geo Scatter Chart',
    classNames: ['add-border'],
    inputs: [
        {
            name: 'ds',
            type: 'dataset',
            label: 'Dataset to display',
            category: 'Configure chart'
        },
        {
            name: 'latDim',
            type: 'dimension',
            label: 'Latitude',
            config: { dataset: 'ds' },
            category: 'Configure chart'
        },
        {
            name: 'lonDim',
            type: 'dimension',
            label: 'Longitude',
            config: { dataset: 'ds' },
            category: 'Configure chart'
        },
        {
            name: 'valueMetric1',  // Updated to allow multiple values
            type: 'dimension',
            label: 'Value Metric 1',  // Plural for multiple values
            config: { dataset: 'ds' },
            category: 'Configure chart'
        },

        {
            name: 'valueMetric2',  // Updated to allow multiple values
            type: 'measure',
            label: 'Value Metric 2',  // Plural for multiple values
            config: { dataset: 'ds' },
            category: 'Configure chart'
        }
    ]
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(GeoMap, meta, {
    props: (inputs: Inputs<typeof meta>) => {
        return {
            ...inputs,
            results: loadData({
                from: inputs.ds,
                dimensions: [
                    inputs.latDim,
                    inputs.lonDim,
                    inputs.valueMetric1 // Spread to handle multiple value metrics
                ],
                measures: [inputs.valueMetric2]

            })
        };
    }
});
