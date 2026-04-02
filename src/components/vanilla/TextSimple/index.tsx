import React, { useEffect, useState } from 'react';
import Title from '../Title';
import Description from '../Description';

import { translateText } from '../translateText';

type Props = {
  title?: string;
  body?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  clientContext?: {
    language?: string;
  };
};

export default (props: Props) => {
  const { title, body, titleFontSize, bodyFontSize, clientContext } = props;
  const language = clientContext?.language;

  const [translatedBody, setTranslatedBody] = useState<string | undefined>(body);

  useEffect(() => {
    const translateBody = async () => {
      if (language && body) {
        try {
          const result = await translateText(body, language);
          setTranslatedBody(result);
        } catch (error) {
          console.error('Error translating body:', error);
          setTranslatedBody(body); // fallback to original
        }
      } else {
        setTranslatedBody(body);
      }
    };

    translateBody();
  }, [language, body]);

  const containerStyle = {
    padding: '20px',
    borderRadius: '8px',
  };

  const titleStyle = {
    fontSize: titleFontSize ? `${titleFontSize}px` : 'inherit',
    lineHeight: titleFontSize ? '1.2em' : 'inherit',
    fontWeight: 'bold',
    marginBottom: '10px',
  };

  const bodyStyle = {
    fontSize: bodyFontSize ? `${bodyFontSize}px` : 'inherit',
    lineHeight: bodyFontSize ? '1.2em' : 'inherit',
    fontWeight: 'bold',
    marginTop: '0',
  };

  return (
    <div style={containerStyle}>
      {title && <Title title={title} style={titleStyle} />}
      {translatedBody && <Description description={translatedBody} style={bodyStyle} />}
    </div>
  );
};
