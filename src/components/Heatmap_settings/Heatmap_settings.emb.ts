import { EmbeddedComponentMeta, Inputs, defineComponent } from '@embeddable.com/react';
import { Dataset, loadData } from '@embeddable.com/core';
import HeatmapComponent from './index';

export const meta = {
    name: 'Heatmap_settings',
    label: 'Heatmap with settings',
    classNames: ['add-border'],
    inputs: [
        {
            name: 'ds',
            type: 'dataset',
            label: 'Dataset to display',
            category: 'Configure chart'
        },
        {
            name: 'xDim',
            type: 'string', // Now a plain string instead of a dimension selector
            label: 'xDim (as string)',
            category: 'Configure chart',
            defaultValue: 'impressions.hour'
        },
        {
            name: 'yDim',
            type: 'string', // Now a plain string instead of a dimension selector
            label: 'yDim (as string)',
            category: 'Configure chart',
            defaultValue: 'impressions.month'
        },
        {
            name: 'valueMeasure',
            type: 'string',
            label: 'valueMeasure (as string)',
            config: {
                dataset: 'ds'
            },
            category: 'Configure chart',
            defaultValue: 'impressions.impression_unfiltered_calculation'
        },
    ]
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(HeatmapComponent, meta, {
    props: (inputs: Inputs<typeof meta>) => {
        return {
            ...inputs,
            results: loadData({
                from: inputs.ds,
                dimensions: [asDimension(inputs.xDim), asDimension(inputs.yDim)], // Convert the slice to a dimension
                measures: [asMeasure(inputs.valueMeasure)]
            })
        };
    }
});

// Helper function to wrap a string as a dimension object
function asDimension(Dim: string | any): any {
    return typeof Dim === 'string' ? { name: Dim, __type__: 'dimension' } : Dim;
}

function asMeasure(valueMeasure: string | any): any {
    return typeof valueMeasure === 'string' ? { name: valueMeasure, __type__: 'measure' } : valueMeasure;
}
