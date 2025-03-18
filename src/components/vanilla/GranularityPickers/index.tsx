import React, { useState } from 'react';

const GranularityPickerComponent = ({
  defaultGranularity,
  onPickGranularity,
}: {
  defaultGranularity: string;
  onPickGranularity: (value: string) => void;
}) => {
  const [selectedGranularity, setSelectedGranularity] = useState<string>(defaultGranularity);

  // Handle granularity selection
  const handleGranularityChange = (value: string) => {
    setSelectedGranularity(value);
    onPickGranularity(value); // Fire the event with the selected value
  };

  return (
    <div className="granularity-picker-container">
      <div className="granularity-options">
        {['hour', 'day', 'month', 'year'].map((granularity) => (
          <button
            key={granularity}
            className={`granularity-button ${selectedGranularity === granularity ? 'selected' : ''}`}
            onClick={() => handleGranularityChange(granularity)}
          >
            {granularity.charAt(0).toUpperCase() + granularity.slice(1)}
          </button>
        ))}
      </div>

      <style jsx>{`
        .granularity-picker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .granularity-options {
          display: flex;
          gap: 12px;
        }

        .granularity-button {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          background: linear-gradient(135deg, #ff6b00, #ff2e2e);
          color: white;
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 8px rgba(255, 47, 47, 0.3);
        }

        .granularity-button:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #ff5722, #d32f2f);
          box-shadow: 0 6px 12px rgba(211, 47, 47, 0.4);
        }

        .granularity-button.selected {
          background: linear-gradient(135deg, #d32f2f, #b71c1c);
          box-shadow: 0 6px 12px rgba(183, 28, 28, 0.5);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default GranularityPickerComponent;
