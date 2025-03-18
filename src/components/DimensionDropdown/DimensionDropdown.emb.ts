import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { loadData, Value } from '@embeddable.com/core';

import DropdownDimensionNames from './index';

export const meta: EmbeddedComponentMeta = {
    name: 'DimensionDropdown',
    label: 'Dimension dropdown',
    defaultWidth: 320,
    defaultHeight: 80,
    inputs: [
        {
            name: 'ds',
            type: 'dataset',
            label: 'Dataset to display',
        },
        {
            name: 'values',
            type: 'dimension',
            label: 'Dimension',
            config: {
                dataset: 'ds',
            },
            array: true,  // Allow multiple dimensions
        },
        {
            name: 'defaultValue',
            type: 'string',
            label: 'Default value',
            description: 'Initial value',
        },
    ],
    events: [
        {
            name: 'onChange', // Pass an event called OnChange to your component as a prop
            label: 'Change', // How this event appears in the builder UI when defining interactions
            properties: [
                {
                    name: 'value', // The property name to be passed back to the builder
                    type: 'string', // The value's expected type
                    array: false // Set to true for a multi-select dropdown
                },
            ],
        },
    ],
    variables: [
        {
            name: 'chosen value',  // Variable created automatically when this component is added
            type: 'string',
            defaultValue: 'Value.noFilter()', // Initial variable value (this can also be set in the no-code builder)
            inputs: ['defaultValue'], // Connects the variable to the 'defaultValue' input, which is passed into the React component
            events: [{ name: 'onChange', property: 'value' }], // On the 'onChange' event, update the 'chosen value' variable with the 'value' property from the event
        },
    ],
};



export default defineComponent<Inputs>(DropdownDimensionNames, meta, {
    props: (inputs) => {
        const dimensionNames = (inputs.values ?? []).map(dimension => dimension.name);
        return {
            ...inputs,
            dimensionNames,
        };
    },
    events: {
        onChange: (value) => ({ value: value || Value.noFilter() }),
    },
});
