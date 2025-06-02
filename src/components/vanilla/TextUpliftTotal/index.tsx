import React, { useEffect, useState } from 'react';
import Title from '../Title';
import Description from '../Description';
import { translateText } from '../translateText';
import { Measure, DataResponse } from '@embeddable.com/core';

type Props = {
  title?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  body?: string;
  KPIvalue?: string;
  metrics: Measure[];
  results: DataResponse;
  AbsolutePercentage?: boolean;
  clientContext?: {
    language?: string;
  };
};

export default (props: Props) => {
  const {
    title,
    body,
    titleFontSize,
    metrics,
    bodyFontSize,
    results,
    KPIvalue,
    AbsolutePercentage,
    clientContext,
  } = props;

  const { isLoading, data, error } = results;
  const language = clientContext?.language;

  const [translatedTitle, setTranslatedTitle] = useState(title || '');
  const [translatedBody, setTranslatedBody] = useState(body || '');

  // Divide metrics into two slices
  const slice1 = metrics.slice(0, 2);
  const slice2 = metrics.slice(2, 4);
  const selectedSlice = AbsolutePercentage ? slice2 : slice1;

  let metricValue: any = null;
  let displayBody = body;

  if (KPIvalue?.includes('Units of Sales') && selectedSlice[0]) {
    metricValue = data?.[0]?.[selectedSlice[0].name];
    displayBody = 'Units of Sales';
  } else if (KPIvalue?.includes('Sales in CLP$') && selectedSlice[1]) {
    metricValue = data?.[0]?.[selectedSlice[1].name];
    displayBody = 'Sales in CLP$';
  }

  const displayMetricValue =
    metricValue !== null && metricValue !== undefined
      ? AbsolutePercentage
        ? `+${Number(metricValue).toLocaleString("en-US")}%`
        : KPIvalue?.includes('Sales in CLP$')
          ? `+$${Number(metricValue).toLocaleString("en-US")}`
          : `+${Number(metricValue).toLocaleString("en-US")}`
      : 'No data';


  // Translation side effect
  useEffect(() => {
    const doTranslation = async () => {
      if (!language) return;

      if (title) {
        const translated = await translateText(title, language);
        setTranslatedTitle(translated);
      }

      if (displayBody) {
        const translatedBodyText = await translateText(displayBody, language);
        setTranslatedBody(translatedBodyText);
      }
    };

    doTranslation();
  }, [language, title, displayBody]);

  // Style settings
  const titleStyle = {
    fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
    lineHeight: titleFontSize ? '1.2em' : undefined,
    color: '#a53241',
    fontFamily: 'Arial, sans-serif',

  };

  const bodyStyle = {
    fontSize: bodyFontSize ? `${bodyFontSize}px` : undefined,
    lineHeight: bodyFontSize ? '1.2em' : undefined,
    color: '#00aa00',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
      height: '100%'
    }}>
      {translatedTitle && <Title title={translatedTitle} style={titleStyle} />}
      <Description
        description={`${displayMetricValue} ${translatedBody || displayBody ? ` ${translatedBody || displayBody}` : ''}`}
        style={bodyStyle}
      />

    </div>
  );
};
