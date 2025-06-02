/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState } from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';
import { translateText } from '../translateText';

interface Props {
    title?: string;
    metrics?: Measure[];
    results: DataResponse;
    clientContext?: {
        language?: string;
    };
}

export default function DualMetricCard({ title, metrics, results, clientContext }: Props) {
    const { data } = results;
    const language = clientContext?.language;
    const [showTooltip, setShowTooltip] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [containerWidth, setContainerWidth] = useState(0);

    const [translatedTitle, setTranslatedTitle] = useState<string | undefined>(title);
    const [translatedUplift, setTranslatedUplift] = useState<string>('Uplift');

    useEffect(() => {
        if (!language) return;
        (async () => {
            try {
                if (title) setTranslatedTitle(await translateText(title, language));
                setTranslatedUplift(await translateText('Uplift', language));
            } catch (e) {
                console.error('Translation error', e);
            }
        })();
    }, [title, language]);

    const firstMetric = metrics?.[0];
    const secondMetric = metrics?.[1];

    const firstRaw = firstMetric ? +data?.[0]?.[firstMetric.name] : undefined;
    const secondRaw = secondMetric ? +data?.[0]?.[secondMetric.name] : undefined;

    const firstDisplay = Number.isFinite(firstRaw) ? firstRaw.toFixed(2) : 'No data';

    const getSecondColour = () => {
        if (!Number.isFinite(secondRaw)) return 'inherit';
        return secondRaw! < 0 ? '#F04B55' : '#00aa00';
    };

    const renderSecond = () => {
        if (!Number.isFinite(secondRaw)) return null;
        const sign = secondRaw! > 0 ? '+ ' : '';
        return `${sign}${secondRaw}% ${translatedUplift}`;
    };

    const tooltipContent = secondRaw !== undefined
        ? (
            <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                <div>
                    Basket Size <span style={{ fontWeight: 'bold', color: '#AF3241' }}>with C.A.P.</span> is{' '}
                    <span style={{ color: '#AF3241', fontWeight: 'bold' }}>{firstRaw?.toFixed(2)}</span>
                </div>
                <div>
                    Basket Size Uplift is{' '}
                    <span style={{ color: secondRaw < 0 ? '#f04b55' : '#00aa00', fontWeight: 'bold' }}>
                        {renderSecond()}
                    </span>
                </div>
            </div>
        )
        : (
            <div style={{ fontFamily: 'Arial', fontSize: '12px', color: '#000' }}>
                Basket Size <span style={{ color: '#62626E', fontWeight: 'bold' }}>without C.A.P.</span> is{' '}
                <span style={{ fontWeight: 'bold', color: '#62626E' }}>{firstRaw?.toFixed(2)}</span>
            </div>
        );

    return (
        <div
            style={{
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                position: 'relative',
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
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333942' }}>{firstDisplay}</div>

                {Number.isFinite(secondRaw) && (
                    <div
                        style={{
                            fontSize: '20px',
                            color: getSecondColour(),
                            fontWeight: 'bold',
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                        }}
                    >
                        {renderSecond()}
                    </div>
                )}
            </div>

            {showTooltip && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${mousePos.y + 10}px`,
                        left: `${Math.min(mousePos.x + 10, containerWidth - 210)}px`,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        borderRadius: '6px',
                        zIndex: 10,
                        width: 'max-content',
                        maxWidth: '250px',
                        pointerEvents: 'none',
                    }}
                >
                    {tooltipContent}
                </div>
            )}
        </div>
    );
}