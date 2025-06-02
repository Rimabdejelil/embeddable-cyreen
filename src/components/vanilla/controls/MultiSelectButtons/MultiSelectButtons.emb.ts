import { Value } from '@embeddable.com/core';
import { EmbeddedComponentMeta, Inputs, defineComponent } from '@embeddable.com/react';

import Component from './index';
import { X } from 'lucide-react';

export const meta = {
  name: 'MultiSelectButtons',
  label: 'Multiselect buttons',
  defaultWidth: 400,
  defaultHeight: 80,
  category: 'Controls: inputs & dropdowns',
  inputs: [
    {
      name: 'values',
      type: 'string',
      array: true,
      label: 'Values',
      category: 'Button values'
    },
    {
      name: 'title',
      type: 'string',
      label: 'Title',
      category: 'Settings'
    },
    {
      name: 'defaultValue',
      type: 'string',
      array: true,
      label: 'Default value',
      category: 'Pre-configured variables'
    },
    {
      name: 'Ranking',
      type: 'string',
      label: 'Ranking Value',
      category: 'Settings'
    }
  ],
  events: [
    {
      name: 'onChange',
      label: 'Change',
      properties: [
        {
          name: 'value',
          type: 'string',
          array: true
        },
        {
          name: 'CR',
          type: 'string',
          array: true
        },
        {
          name: 'Basket',
          type: 'string',
          array: true
        },
        {
          name: 'Rank_Stores',
          type: 'string',
          array: true
        },
        {
          name: 'Rank_Weekdays',
          type: 'string',
          array: true
        },
        {
          name: 'Rank_HourGroup',
          type: 'string',
          array: true
        },
        {
          name: 'xAxis',
          type: 'string',
          array: true
        },
        {
          name: 'SortBy',
          type: 'string',
          array: true
        },
        {
          name: 'KPIvalue',
          type: 'string',
          array: true
        }
      ]
    }
  ],
  variables: [
    {
      name: 'SalesUplift',
      type: 'string',
      array: true,
      defaultValue: 'Units of Sales',
      inputs: ['defaultValue'],
      events: [{ name: 'onChange', property: 'value' }]
    }
  ]
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(Component, meta, {
  props: (inputs: Inputs<typeof meta>, _state, clientContext) => {
    return {
      ...inputs,
      clientContext
    };
  },
  events: {
    onChange: ({ value, label, Ranking }) => {
      const isAbsolute = label === 'Rank By               Difference';
      const isRelative = label === 'Rank By               Uplift';
      const isNoRank = label === 'No Ranking';
      const isCR = label === 'Conversion Rate';
      const isBasket = label === 'Average Basket Size';
      const isAbsoluteDifference = Ranking === 'Absolute Difference (in pp)';
      const isRelativeDifference = Ranking === 'Relative Difference (in %)';
      const isNoRanking = Ranking === 'No Ranking';
      const isHour = label === "Hourly";
      const isDay = label === "Daily";
      const isWeekday = label === "Weekday";
      const isMonth = label === "Monthly";
      const isSales = label === "Sales (Units)"
      const isRevenue = label === "Revenue (CLP$)"

      // Always include the value in the return object
      return {
        value: value || Value.noFilter(),
        CR: isNoRank ? 'big_dm.name_adlevel1' : isAbsolute ? 'big_dm.conversion_difference_base' : isRelative ? 'big_dm.conversion_uplift_sort' : undefined,
        Basket: isNoRank ? 'big_dm.name_adlevel1' : isAbsolute ? 'big_dm.basket_difference_base' : isRelative ? 'big_dm.basket_uplift_sort' : undefined,
        Rank_Stores: isAbsoluteDifference ? (isCR ? 'big_dm.conversion_difference_base' : isBasket ? 'big_dm.basket_difference_base' : undefined) : isRelativeDifference ? (isCR ? 'big_dm.conversion_uplift_sort' : isBasket ? 'big_dm.basket_uplift_sort' : undefined) : isNoRanking ? 'big_dm.name_store' : 'big_dm.name_store',
        Rank_Weekdays: isAbsoluteDifference ? (isCR ? 'big_dm.conversion_difference_base' : isBasket ? 'big_dm.basket_difference_base' : undefined) : isRelativeDifference ? (isCR ? 'big_dm.conversion_uplift_sort' : isBasket ? 'big_dm.basket_uplift_sort' : undefined) : isNoRanking ? 'big_dm.weekday_agg_string' : 'big_dm.weekday_agg_string',
        Rank_HourGroup: isAbsoluteDifference ? (isCR ? 'big_dm.conversion_difference_base' : isBasket ? 'big_dm.basket_difference_base' : undefined) : isRelativeDifference ? (isCR ? 'big_dm.conversion_uplift_sort' : isBasket ? 'big_dm.basket_uplift_sort' : undefined) : isNoRanking ? 'big_dm.hour_value' : 'big_dm.hour_value',
        xAxis: isHour ? 'receipts_retail.hour' : isDay? 'receipts_retail.date': isWeekday ? 'receipts_retail.dow' : isMonth ? 'receipts_retail.month' : undefined,
        SortBy: isHour ? 'receipts_retail.hour' : isDay? 'receipts_retail.date': isWeekday ? 'receipts_retail.weekday_agg_string' : isMonth ? 'receipts_retail.month_sort' : undefined,
        KPIvalue: isSales? 'Sales (Units)' : isRevenue? 'Revenue (CLP$)' : undefined
      };
    }
  }
});