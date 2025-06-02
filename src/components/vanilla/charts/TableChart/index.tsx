import { DataResponse, DimensionOrMeasure, OrderBy, OrderDirection } from '@embeddable.com/core';
import { useEmbeddableState } from '@embeddable.com/react';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import { SortDirection } from '../../../../enums/SortDirection';
import { REGULAR_FONT_SIZE } from '../../../constants';
import formatValue from '../../../util/format';
import Container from '../../Container';
import TableHead from './components/TableHead';

export type Props = {
  limit?: number;
  results: DataResponse;
  defaultSort?: { property: DimensionOrMeasure; direction: string }[];
  columns: DimensionOrMeasure[];
  title: string;
  fontSize?: number;
  minColumnWidth?: number;
};

type Meta = {
  sort: OrderBy[];
  prevVariableValues: Record<string, any>;
};

export default (props: Props) => {
  const { columns, results } = props;
  const [tooltip, setTooltip] = useState<{
    content: React.ReactNode;
    x: number;
    y: number;
  } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Column title mappings
  const mapColumnTitle = (title: string) => {
    const mappings: Record<string, string> = {
      'Total Frequency': 'Frequency',
      'Total revenue': 'Revenue',
      'Total Sale': 'Sales'
    };
    return mappings[title] || title;
  };

  // Format tooltip content with styled parts
  const formatTooltipContent = (
    rowValue: string,
    cellValue: string | number,
    column: DimensionOrMeasure
  ) => {
    const formattedValue = formatColumn(cellValue, column);
    const columnTitle = mapColumnTitle(column.title || column.name);

    return (
      <span>
        <span style={{ fontWeight: 'bold', color: '#AF3241' }}>{rowValue}</span>
        {` generated `}
        <span style={{ fontWeight: 'bold', color: '#AF3241' }}>{formattedValue}</span>
        {` in `}
        {columnTitle}
        {`.`}
      </span>
    );
  };


  const [meta, setMeta] = useEmbeddableState({
    sort: props.defaultSort,
    prevVariableValues: {},
  }) as [Meta, (f: (m: Meta) => Meta) => void];

  const updateSort = useCallback(
    (column: DimensionOrMeasure) => {
      if (!meta) return;

      const sort: OrderBy[] = meta.sort?.slice() || [];
      const invert = { asc: 'desc', desc: 'asc' };
      const index = sort.findIndex((c) => c.property.name === column.name);

      if (index === 0) {
        sort[0] = { ...sort[0], direction: invert[sort[0].direction] as OrderDirection };
      } else {
        const [newOrder] = sort.splice(index, 1);
        sort.unshift(newOrder);
      }

      setMeta((meta) => ({ ...meta, sort }));
    },
    [meta, setMeta],
  );

  const handleCellMouseEnter = useCallback(
    (e: React.MouseEvent, row: Record<string, any>, column: DimensionOrMeasure, columnIndex: number) => {
      // Only show tooltip for columns starting from the 3rd one (index 2)
      if (columnIndex < 1) return;

      const rowValue = row[columns[0].name]; // Value from first column
      const cellValue = row[column.name]; // Value from current cell

      // Skip if any required value is missing
      if (!rowValue || cellValue === undefined || cellValue === null) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const tableRect = tableRef.current?.getBoundingClientRect();

      if (!tableRect) return;

      setTooltip({
        content: formatTooltipContent(rowValue, cellValue, column),
        x: rect.left - tableRect.left + rect.width / 2,
        y: rect.top - tableRect.top
      });
    },
    [columns]
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <Container
      {...props}
      className="overflow-y-auto"
      childContainerClassName="overflow-x-auto"
    >
      {/* Add title with custom styling */}
      {props.title && (
        <div
          style={{
            color: '#a53241',
            fontSize: '23px',
            fontFamily: 'Arial, sans-serif',
            marginBottom: '20px',
          }}
        >
          {props.title}
        </div>
      )}
      <div style={{
        minWidth: `${columns.length * (props.minColumnWidth ?? 100)}px`,
        position: 'relative'
      }}>
        {!!meta && !(props.results?.isLoading && !props.results?.data?.length) && (
          <div style={{ position: 'relative' }}>
            <table
              ref={tableRef}
              className="overflow-visible w-full"
              style={{ fontSize: props.fontSize ? `${props.fontSize}px` : REGULAR_FONT_SIZE }}
            >
              <TableHead
                columns={columns}
                sortBy={meta?.sort?.[0]?.property}
                sortDirection={
                  meta?.sort?.[0]?.direction === 'asc'
                    ? SortDirection.ASCENDING
                    : SortDirection.DESCENDING
                }
                onSortingChange={updateSort}
                minColumnWidth={props.minColumnWidth ? props.minColumnWidth : undefined}
              />

              <tbody>
                {results?.data?.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-400/5">
                    {columns.map((column, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="text-dark p-3 truncate"
                        style={{
                          fontSize: props.fontSize ? `${props.fontSize}px` : REGULAR_FONT_SIZE,
                          maxWidth: props.minColumnWidth ? `${props.minColumnWidth * 1.2}px` : 'auto',
                        }}
                        onMouseEnter={(e) => handleCellMouseEnter(e, row, column, columnIndex)}
                        onMouseLeave={handleCellMouseLeave}
                      >
                        <span title={formatColumn(row[column.name], column) ?? ''}>
                          {formatColumn(row[column.name], column)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tooltip element */}
            {tooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: `${tooltip.y}px`,
                  left: `${tooltip.x}px`,
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  fontSize: '12px',
                  fontFamily: 'Arial, sans-serif',
                  pointerEvents: 'none',
                  transform: 'translateX(-50%) translateY(-100%)',
                  minWidth: '200px',
                  maxWidth: '300px',
                  border: '1px solid #eee'
                }}
              >
                {tooltip.content}
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

function formatColumn(text: string | number, column: DimensionOrMeasure) {
  // Special formatting for "Total revenue" column
  if (column.title === 'Total revenue' || column.name === 'Total revenue') {
    if (text === null || text === undefined) return '';

    // Convert to number if it's a string
    const numValue = typeof text === 'string' ? parseFloat(text) : text;

    // Divide by 1000 and round to nearest integer
    const valueInThousands = Math.round(numValue / 1000);

    // Format with CLP$ prefix and comma separators
    return `CLP$ ${valueInThousands.toLocaleString('en-US', {
      maximumFractionDigits: 0
    })}K`;
  }
  else if (column.title === 'Total Sale') {
    if (text === null || text === undefined) return '';

    // Convert to number if it's a string
    const numValue = typeof text === 'string' ? parseFloat(text) : text;

    // Divide by 1000 and round to nearest integer
    const valueInThousands = Math.round(numValue / 1000);

    // Format with CLP$ prefix and comma separators
    return `${valueInThousands.toLocaleString('en-US', {
      maximumFractionDigits: 0
    })}K`;
  }

  // Default formatting for other columns
  if (typeof text === 'number' || column.nativeType === 'number') {
    return formatValue(`${text}`, { type: 'number', meta: column?.meta });
  }

  if (text && column.nativeType === 'time') return formatValue(text, 'date');

  return formatValue(text);
}