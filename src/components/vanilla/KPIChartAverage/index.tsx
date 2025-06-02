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
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (!clientContext?.language) return;

        (async () => {
            try {
                if (title) setTranslatedTitle(await translateText(title, clientContext.language));
                setTranslatedUplift(await translateText('Uplift', clientContext.language));
            } catch (err) {
                // graceful degradation – keep original strings
                /* eslint-disable-next-line no-console */
                console.error('Translation failed', err);
            }
        })();
    }, [title, clientContext?.language]);

    // ----------------------------------------------------------------
    // DATA EXTRACTION
    // ----------------------------------------------------------------
    const firstMetric = metrics?.[0];
    const secondMetric = metrics?.[1];

    const firstRaw = firstMetric ? +data?.[0]?.[firstMetric.name] : undefined;
    const secondRaw = secondMetric ? +data?.[0]?.[secondMetric.name] : undefined;

    const firstDisplay = Number.isFinite(firstRaw)
        ? `${Math.round(firstRaw)} minutes`
        : 'No data';


    // color logic for second value
    const secondColour = secondRaw !== undefined && secondRaw < 0 ? '#F04B55' : '#00aa00';

    // helper for rendering uplift string
    const renderUplift = () => {
        if (!Number.isFinite(secondRaw)) return null;
        const sign = secondRaw > 0 ? '+ ' : '';
        return `${sign}${secondRaw}% ${translatedUplift}`;
    };

    // ----------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------
    const tooltipContent = secondRaw !== undefined
        ? (
            <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                <div>
                    Conversion Rate <span style={{ color: '#AF3241', fontWeight: 'bold' }}>with C.A.P.</span>{' '}
                    is <span style={{ fontWeight: 'bold', color: '#AF3241' }}>{firstRaw?.toFixed(2)}%</span>
                </div>
                <div>
                    Conversion Uplift is{' '}
                    <span style={{ color: secondRaw < 0 ? '#f04b55' : '#00aa00', fontWeight: 'bold' }}>
                        {renderUplift()}
                    </span>
                </div>
            </div>
        )
        : (
            <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                <span style={{ color: '#AF3241', fontWeight: 'bold' }}>{Math.round(firstRaw)} minutes</span>{' '}
                is the average duration spent by shoppers in the store.
            </div>
        );

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
                height: '100%'
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

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333942' }}>
                    {isLoading ? '...' : firstDisplay}
                </div>

                {Number.isFinite(secondRaw) && (
                    <div
                        style={{
                            fontSize: '20px',
                            color: secondColour,
                            fontWeight: 'bold',
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                        }}
                    >
                        {renderUplift()}
                    </div>
                )}
            </div>

            {showTooltip && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${mousePos.y + 10}px`,
                        left: `${Math.min(mousePos.x + 10, containerWidth - 290)}px`,
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
                    {tooltipContent}
                </div>
            )}
        </div>
    );
}