import React from 'react';

type Props = {
  title?: string;
  style?: React.CSSProperties;
};

export default function Title({ title, style }: Props) {
  return (
    !!title && (
      <h2
        className="w-full justify-start flex leading-6 mb-2"
        style={{
          color: '#a53241',
          fontSize: '23px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          alignSelf: 'flex-start',
          ...style, // allow override if needed
        }}
      >
        {title}
      </h2>
    )
  );
}
