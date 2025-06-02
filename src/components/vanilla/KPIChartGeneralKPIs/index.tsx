/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState } from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';
import { translateText } from '../translateText';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
interface Props {
    title?: string;
    metrics?: Measure[];
    results: DataResponse;
    clientContext?: {
        language?: string;
    };
}

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------
export default function SingleNumberCard({ title, metrics, results, clientContext }: Props) {
    const { isLoading, data } = results;

    // ----------------------------------------------------------------
    // TRANSLATIONS
    // ----------------------------------------------------------------
    const [translatedTitle, setTranslatedTitle] = useState<string | undefined>(title);
    const [translatedUplift, setTranslatedUplift] = useState<string>('Uplift');
    const [translatedDailyAverage, setTranslatedDailyAverage] = useState<string>('Daily Average');
    const [translatedShopperAverage, setTranslatedShopperAverage] = useState<string>('Shopper Average');
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (!clientContext?.language) return;

        (async () => {
            try {
                if (title) setTranslatedTitle(await translateText(title, clientContext.language));
                setTranslatedUplift(await translateText('Uplift', clientContext.language));
                setTranslatedDailyAverage(await translateText('Daily Average', clientContext.language));
                setTranslatedShopperAverage(await translateText('Shopper Average', clientContext.language));
            } catch (err) {
                // graceful degradation – keep original strings
                /* eslint-disable-next-line no-console */
                console.error('Translation failed', err);
            }
        })();
    }, [title, clientContext?.language]);

    // ----------------------------------------------------------------
    // DATA EXTRACTION AND FORMATTING
    // ----------------------------------------------------------------
    const firstMetric = metrics?.[0];
    const secondMetric = metrics?.[1];

    const firstRaw = firstMetric ? +data?.[0]?.[firstMetric.name] : undefined;
    const secondRaw = secondMetric ? +data?.[0]?.[secondMetric.name] : undefined;

    // Format first value with K suffix (e.g., 3,428K)
    const formatFirstValue = () => {
        if (!Number.isFinite(firstRaw)) return 'No data';

        const numValue = Math.round(firstRaw as number);
        const valueInK = (numValue / 1000).toFixed(0);
        const formattedNumber = valueInK.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'K';

        switch (title) {
            case 'Total Revenue':
                return `CLP$ ${formattedNumber}`;
            case 'Total Sales':
                return `${formattedNumber} units`;
            default: // Total Shoppers and others
                return formattedNumber;
        }
    };

    // Format second value with commas (no K suffix)
    const formatSecondValue = () => {
        if (!Number.isFinite(secondRaw)) return 'No data';

        const numValue = secondRaw as number;
        const formattedNumber = numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        switch (title) {
            case 'Total Revenue':
                return `CLP$ ${formattedNumber}`;
            case 'Total Sales':
                return `${formattedNumber} units`;
            default: // Total Shoppers and others
                return formattedNumber;
        }
    };

    // Get second value title based on main title
    const getSecondValueTitle = () => {
        switch (title) {
            case 'Total Revenue':
                return translatedShopperAverage;
            case 'Total Sales':
                return translatedShopperAverage;
            default: // Total Shoppers and others
                return translatedDailyAverage;
        }
    };

    // ----------------------------------------------------------------
    // TOOLTIP CONTENT
    // ----------------------------------------------------------------
    const getTooltipContent = () => {
        if (!Number.isFinite(firstRaw) || !Number.isFinite(secondRaw)) return null;

        const firstFormatted = formatFirstValue();
        const secondFormatted = formatSecondValue();

        switch (title) {
            case 'Total Revenue':
                return (
                    <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                        <div>
                            Total revenue spent by shoppers{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{firstFormatted}</span>.
                        </div>
                        <div>
                            On average, each shopper spent{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{secondFormatted}</span>.
                        </div>
                    </div>
                );
            case 'Total Sales':
                return (
                    <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                        <div>
                            Total number of units bought by shopper{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{firstFormatted}</span>.
                        </div>
                        <div>
                            On average, each shopper bought{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{secondFormatted}</span>.
                        </div>
                    </div>
                );
            default: // Total Shoppers
                return (
                    <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                        <div>
                            Total number of shoppers visited the selected stores{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{firstFormatted}</span>.
                        </div>
                        <div>
                            On average per day,{' '}
                            <span style={{ color: '#a53241', fontWeight: 'bold' }}>{secondFormatted}</span>{' '}
                            shoppers were inside the selected stores.
                        </div>
                    </div>
                );
        }
    };

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [containerWidth, setContainerWidth] = useState(0);

    return (
        <div
            style={{
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                minHeight: '150px' // Added to ensure consistent card height
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }}
            ref={(el) => {
                if (el) {
                    const { width } = el.getBoundingClientRect();
                    setContainerWidth(width);
                }
            }}
        >
            {translatedTitle && (
                <h2 style={{ color: '#a53241', fontSize: '23px' }}>{translatedTitle}</h2>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative' // Added for positioning the second value
            }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#333942',
                    alignSelf: 'flex-end' // Aligns first value to bottom
                }}>
                    {isLoading ? '...' : formatFirstValue()}
                </div>

                {Number.isFinite(secondRaw) && (
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        bottom: '-42px',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '14px', color: '#000', fontWeight: 'bold' }}>
                            {getSecondValueTitle()}:
                        </span>
                        <span style={{ fontSize: '20px', color: '#6B8E23', fontWeight: 'bold' }}>
                            {formatSecondValue()}
                        </span>
                    </div>
                )}
            </div>

            {showTooltip && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${mousePos.y + 10}px`,
                        left: `${Math.min(mousePos.x + 10, containerWidth - 300)}px`,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        borderRadius: '6px',
                        zIndex: 10,
                        width: 'max-content',
                        maxWidth: '300px',
                        pointerEvents: 'none',
                    }}
                >
                    {getTooltipContent()}
                </div>
            )}
        </div>
    );
}