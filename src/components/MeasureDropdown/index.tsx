import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
type Props = {
    measureNames: string[];
    onChange: (value: string) => void;
};

const DropdownMeasureNames = ({ measureNames, onChange }: Props) => {
    const [selectedName, setSelectedName] = useState('');

    useEffect(() => {
        // Reset selection if measureNames change and the current selection is no longer valid
        if (!measureNames.includes(selectedName)) {
            setSelectedName('');
        }
    }, [measureNames, selectedName]);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        setSelectedName(newValue);
        onChange(newValue);
    };

    const handleClear = () => {
        setSelectedName('');
        onChange('');
    };

    return (
        <div className="dropdown-container">
            <div className="dropdown-wrapper">
                <select
                    value={selectedName}
                    onChange={handleChange}
                    className={`dropdown ${!selectedName ? 'placeholder' : ''}`}
                >
                    <option value="" disabled hidden>
                        Select measure...
                    </option>
                    <option value="">Select measure...</option>
                    {measureNames.map((fullName) => {
                        // Remove dataset prefix if present (e.g., "impressions.id_store" becomes "id_store")
                        const parts = fullName.split('.');
                        const displayName = parts[parts.length - 1];
                        return (
                            <option key={fullName} value={fullName}>
                                {displayName}
                            </option>
                        );
                    })}
                </select>
                {selectedName && (
                    <button className="reset-button" onClick={handleClear}>
                        <XCircle size={20} />
                    </button>
                )}
            </div>

            <style jsx>{`
        .dropdown-container {
                    width: 100%;
                    padding: 10px;
                    background-color: #fff;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                }

                .dropdown-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                .dropdown {
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    appearance: none;
                    cursor: pointer;
                    color: #333;
                }

                .dropdown.placeholder {
                    color: #aaa; /* Lighter color for placeholder */
                }
        .reset-button {
                    position: absolute;
                    right: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #ff5722;
                    transition: 0.3s ease-in-out;
                }

                .reset-button:hover {
                    color: #e64a19;
                    transform: scale(1.1);
                }
      `}</style>
        </div>
    );
};

export default DropdownMeasureNames;
