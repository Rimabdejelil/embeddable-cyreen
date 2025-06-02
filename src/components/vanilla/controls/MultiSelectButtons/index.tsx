import React, { useState, useEffect } from 'react';
import Container from '../../Container';
import { translateText } from '../../translateText';

type Props = {
  title: string;
  values: Array<string>;
  onChange: (v: Array<string>) => void;
  defaultValue?: string;
  Ranking?: string;
  clientContext?: {
    language?: string;
  };
};

export default (props: Props) => {
  const { title, Ranking, values = [], onChange, defaultValue, clientContext } = props;
  const language = clientContext?.language;

  const [selected, setSelected] = useState<string | null>(defaultValue || null);
  const [translatedValues, setTranslatedValues] = useState<Array<string>>([]);


  const handleClick = (label: string) => {
  if (selected !== label) {
    setSelected(label);

    if (label === 'Rank By               Difference') {
      onChange({ value: label, label });
    } else if (label === 'Rank By               Uplift') {
      onChange({ value: label, label });
    } else if (label === 'No Ranking') {
      onChange({ value: label, label });
    }
    else if (label === 'Conversion Rate') {
      onChange({ value: label, label, Ranking });
    }
    else if (label === 'Average Basket Size') {
      onChange({ value: label, label, Ranking });
    }
    else {
      onChange({ value: label, label });
    }
  }
};



  // Function to split text into two lines if it exceeds a certain length
  const splitText = (text: string) => {
    if (text.length > 24) {
      const words = text.split(' ');
      let firstLine = '';
      let secondLine = '';

      words.forEach((word) => {
        if (firstLine.length + word.length + 1 <= 16) {
          firstLine += (firstLine.length ? ' ' : '') + word;
        } else {
          secondLine += (secondLine.length ? ' ' : '') + word;
        }
      });

      return [firstLine, secondLine];
    }
    return [text]; // Return the original text if it's short enough
  };

  useEffect(() => {
    const translateAll = async () => {
      if (!language) {
        setTranslatedValues(values); // Use original values if no language
        return;
      }

      try {
        const translated = await Promise.all(
          values.map((v) => translateText(v, language))
        );
        setTranslatedValues(translated);
      } catch (error) {
        console.error('Error translating values:', error);
        setTranslatedValues(values);
      }
    };

    translateAll();
  }, [language, values]);

  return (
    <Container title={title}>
      <div className="granularity-picker-container">
        <div className="granularity-options">
          {values.map((value, i) => {
            const isSelected = selected === value;

            const textToDisplay = (translatedValues && translatedValues[i]) || value;
            const lines = splitText(textToDisplay); // Split the text into lines

            return (
              <button
                key={i}
                className={`granularity-button ${isSelected ? 'selected' : ''}`}
                onClick={() => handleClick(value)}
              >
                <div className="multiSelectInner">
                  {lines.map((line, index) => (
                    <div key={index}>{line}</div> // Display each line
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <style jsx>{`
          .granularity-picker-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 100%;
          }

          .granularity-options {
            display: flex;
            gap: 8px;
            justify-content: space-evenly;
            width: 100%;
          }

          .granularity-button {
            height: 80px;
            flex: 1 1 100px;
            min-width: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 8px;
            font-size: 14px;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            white-space: normal; /* Allow text to break into new lines */
            word-wrap: break-word; /* Ensure long words break */
            background: linear-gradient(135deg, #f2f2f2, #e6e6e6);
            color: black;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .granularity-button:hover {
            transform: translateY(-2px);
            background: #AF3241;
            color: white;
            box-shadow: 0 6px 12px rgba(175, 50, 65, 0.4);
          }

          .granularity-button.selected {
            background: #AF3241;
            color: white;
            box-shadow: 0 6px 12px rgba(110, 35, 50, 0.5);
            transform: scale(1.05);
          }

          .multiSelectInner {
            text-align: center;
          }

          .multiSelectInner div {
            padding: 2px;
          }
        `}</style>
      </div>
    </Container>
  );
};
