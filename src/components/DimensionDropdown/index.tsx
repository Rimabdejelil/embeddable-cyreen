import React, { useState, useEffect } from 'react';

type Dimension = {
    name: string;
    title: string;
};

type Props = {
    dimensions: Dimension[];
    onChange: (value: string) => void;
    placeholder?: string;
    defaultXAxis?: string;
    defaultYAxis?: string;
    InstoreDuration?: boolean;  // Changed from string to boolean
};

const DropdownDimensionNames = ({
    dimensions,
    onChange,
    placeholder,
    InstoreDuration,
    defaultXAxis = "impressions.weekday",
    defaultYAxis = "impressions.week"
}: Props) => {
    // Set defaults based on InstoreDuration
    const resolvedDefaultXAxis = InstoreDuration
        ? "customer_journeys.month"
        : defaultXAxis;

    const resolvedDefaultYAxis = InstoreDuration
        ? "customer_journeys.weekday"
        : defaultYAxis;

    const [selectedName, setSelectedName] = useState('');
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        const validNames = dimensions.map(d => d.name);
        if (!validNames.includes(selectedName)) {
            setSelectedName('');
            setDisplayValue('');
        }
    }, [dimensions, selectedName]);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;

        if (newValue === "RESET_PLACEHOLDER") {
            // Reset to default values based on placeholder
            const defaultValue = placeholder === "Select X-axis..." ? resolvedDefaultXAxis :
                placeholder === "Select Y-axis..." ? resolvedDefaultYAxis : '';

            setSelectedName(defaultValue);
            setDisplayValue(''); // This will show the placeholder
            onChange(defaultValue);
        } else {
            setSelectedName(newValue);
            setDisplayValue(newValue);
            onChange(newValue);
        }
    };

    return (
        <div className="dropdown-container">
            <div className="dropdown-wrapper">
                <select
                    value={displayValue}
                    onChange={handleChange}
                    onPointerDown={e => e.stopPropagation()}
                    className={`dropdown ${!displayValue ? 'placeholder' : ''}`}
                >
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                    <option value="RESET_PLACEHOLDER">{placeholder}</option>
                    {dimensions.map(({ name, title }) => (
                        <option key={name} value={name}>
                            {name === 'impressions.id_campaign' ? 'Total' : title}
                        </option>
                    ))}
                </select>
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
                    color: #aaa;
                }
            `}</style>
        </div>
    );
};

export default DropdownDimensionNames;