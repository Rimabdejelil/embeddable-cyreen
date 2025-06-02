import React, { useEffect, useState, useRef } from 'react';
import { Dataset, Dimension, Measure, DataResponse } from '@embeddable.com/core';
import { DivIcon } from 'leaflet';
import { LatLngExpression, LatLngBounds, Map } from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { FaHome } from 'react-icons/fa';
import * as d3 from 'd3';

import 'leaflet/dist/leaflet.css';

type Props = {
    ds: Dataset;
    latDim: Dimension;
    lonDim: Dimension;
    valueMetric1: Dimension;
    valueMetric2: Measure;
    results: DataResponse;
};

const FitMapBounds = ({ markers }: { markers: { position: LatLngExpression }[] }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = new LatLngBounds(markers.map(marker => marker.position));
            map.fitBounds(bounds, { padding: [15, 15], maxZoom: 16 });
        }
    }, [markers, map]);

    return null;
};

const HomeButton = ({ markers }: { markers: { position: LatLngExpression }[] }) => {
    const map = useMap();
    const initialBounds = useRef<LatLngBounds | null>(null);
    const initialCenter = useRef<LatLngExpression | null>(null);
    const initialZoom = useRef<number | null>(null);

    useEffect(() => {
        if (markers.length > 0 && map) {
            const bounds = new LatLngBounds(markers.map(marker => marker.position));

            // Store initial state
            initialBounds.current = bounds;
            initialCenter.current = map.getCenter();
            initialZoom.current = map.getZoom();

            // Fit bounds initially
            map.fitBounds(bounds, { padding: [15, 15] });

            // Update references when map moves or zooms
            const handleMoveEnd = () => {
                initialCenter.current = map.getCenter();
            };

            const handleZoomEnd = () => {
                initialZoom.current = map.getZoom();
            };

            map.on('moveend', handleMoveEnd);
            map.on('zoomend', handleZoomEnd);

            return () => {
                map.off('moveend', handleMoveEnd);
                map.off('zoomend', handleZoomEnd);
            };
        }
    }, [map, markers]);

    const handleHomeClick = () => {
        if (initialBounds.current && initialCenter.current && initialZoom.current !== null && map) {
            // First reset to initial center and zoom
            map.setView(initialCenter.current, initialZoom.current);

            // Then fit bounds to ensure everything is visible
            map.fitBounds(initialBounds.current, {
                padding: [15, 15],
                maxZoom: 16
            });
        }
    };

    return (
        <button
            onClick={handleHomeClick}
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '50%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                zIndex: 1000,
            }}
        >
            <FaHome size={20} color="#a53241" />
        </button>
    );
};

const GeoMap: React.FC<Props> = ({ ds, latDim, lonDim, valueMetric1, valueMetric2, results }) => {
    const { isLoading, error, data } = results;

    const [markers, setMarkers] = useState<
        { position: LatLngExpression; popupContent: string; size: number; label: string }[]
    >([]);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        if (!isLoading && !error && data) {
            const maxValue = Math.max(...data.map((point: any) => point[valueMetric2.name] || 0));

            const newMarkers = data
                .filter((point: { [key: string]: any }) =>
                    point[latDim.name] !== null && point[lonDim.name] !== null
                )
                .map((point: { [key: string]: any }) => {
                    const value1 = point[valueMetric1.name] ?? "Unknown";
                    const value2 = point[valueMetric2.name] ?? 0;

                    const popupContent = `
                        <span style="font-family: Arial; font-size: 12px; color: black;">
                            <span style="color: #a53241; font-weight: bold">${value1}</span> has 
                            <span style="color: #a53241; font-weight: bold">${d3.format(',')(value2)}</span> Impressions
                        </span>
                    `;

                    const size = maxValue > 0 ? 10 + (20 * value2) / maxValue : 10;

                    return {
                        position: [point[latDim.name], point[lonDim.name]],
                        popupContent,
                        size,
                        label: value1,
                    };
                });

            setMarkers(newMarkers);
        }
    }, [isLoading, error, data, latDim, lonDim, valueMetric1, valueMetric2]);

    const handleMarkerHover = (e: any, markerContent: string, isHovered: boolean) => {
        if (tooltipRef.current) {
            tooltipRef.current.innerHTML = markerContent;
            tooltipRef.current.style.display = isHovered ? 'block' : 'none';

            if (e && e.latlng) {
                const { lat, lng } = e.latlng;
                const point = mapRef.current?.latLngToContainerPoint([lat, lng]);

                if (point) {
                    const tooltip = tooltipRef.current;
                    const left = point.x + 10;
                    tooltip.style.left = `${left}px`;
                    tooltip.style.top = `${point.y - 17}px`;
                    tooltip.style.whiteSpace = 'nowrap';
                }
            }
        }
    };

    return (
        <div
            style={{
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                width: '100%',
                height: '100%',
                background: '#fff',
                position: 'relative',
            }}
        >
            <div
                style={{
                    color: '#a53241',
                    fontSize: '23px',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '8px',
                }}
            >
                Store Map
            </div>

            <MapContainer
                center={[51.505, -0.09]}
                zoom={2}
                scrollWheelZoom={true}
                attributionControl={false}
                style={{
                    width: '100%',
                    height: '90%',
                    borderRadius: '8px',
                }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicmltMDQiLCJhIjoiY203eGprczltMDZ6MTJrc2NhbTE0NWJnNSJ9.jtSf8YJjqLcSK1ubO_2qww"
                    attribution=""
                />
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={marker.position}
                        icon={
                            new DivIcon({
                                className: 'custom-marker',
                                iconSize: [marker.size, marker.size],
                                iconAnchor: [marker.size / 2, marker.size / 2],
                                popupAnchor: [0, -marker.size / 2],
                                html: `
                                    <div class="marker-container">
                                        <div class="marker-circle" 
                                             style="width: ${marker.size}px; height: ${marker.size}px;">
                                        </div>
                                        <div class="marker-label">
                                            ${marker.label}
                                        </div>
                                    </div>
                                `,
                            })
                        }
                        eventHandlers={{
                            mouseover: (e) => {
                                handleMarkerHover(e, marker.popupContent, true);
                                const markerElement = e.target.getElement();
                                if (markerElement) {
                                    markerElement.querySelector('.marker-circle')?.classList.add('hovered');
                                }
                            },
                            mouseout: (e) => {
                                handleMarkerHover(null, '', false);
                                const markerElement = e.target.getElement();
                                if (markerElement) {
                                    markerElement.querySelector('.marker-circle')?.classList.remove('hovered');
                                }
                            },
                        }}

                    />
                ))}
                <FitMapBounds markers={markers} />
                <HomeButton markers={markers} />
            </MapContainer>

            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    backgroundColor: 'rgb(255,255,255)',
                    color: 'black',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    display: 'none',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    maxWidth: 'none',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    fontFamily: 'Arial, sans-serif',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            />

            <style>{`
                .marker-container {
                    text-align: center;
                    transform: translateY(-50%);
                }
                
                .marker-circle {
                    background-color: #f04b55;
                    border-radius: 50%;
                    margin: 0 auto;
                    transition: background-color 0.2s ease;
                }
                
                .marker-circle.hovered {
                    background-color: #AF3241 !important;
                }
                
                .marker-label {
                    font-size: 14px;
                    color: #333;
                    margin-top: 2px;
                    font-weight: 500;
                    white-space: nowrap;
                    font-family: Arial, sans-serif;
                }
            `}</style>
        </div>
    );
};

export default GeoMap;