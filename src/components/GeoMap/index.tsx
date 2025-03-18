import React, { useEffect, useState } from 'react';
import { Dataset, Dimension, Measure, DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { DivIcon } from 'leaflet'; // Import DivIcon for custom markers
import { LatLngExpression, LatLngBounds } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css'; // Import leaflet's CSS

type Props = {
    ds: Dataset;
    latDim: Dimension; // Latitude dimension
    lonDim: Dimension; // Longitude dimension
    valueMetric1: Dimension; // First value metric (e.g., dimension)
    valueMetric2: Measure; // Second value metric (e.g., measure)
    results: DataResponse; // Loaded data response
};

// Function to handle setting the map's bounds
const FitMapBounds = ({ markers }: { markers: { position: LatLngExpression }[] }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = new LatLngBounds(markers.map(marker => marker.position));
            map.fitBounds(bounds); // Automatically zoom and center map
        }
    }, [markers, map]);

    return null;
};

const GeoMap: React.FC<Props> = ({ ds, latDim, lonDim, valueMetric1, valueMetric2, results }) => {
    const { isLoading, error, data } = results;

    // State to store the markers after data is loaded
    const [markers, setMarkers] = useState<{ position: LatLngExpression; popupContent: string }[]>([]);

    useEffect(() => {
        if (!isLoading && !error && data) {
            const newMarkers = data
                .filter((point: { [key: string]: any }) =>
                    point[latDim.name] !== null && point[lonDim.name] !== null
                )
                .map((point: { [key: string]: any }) => {
                    const value1 = point[valueMetric1.name] ?? "Unknown"; 
                    const value2 = point[valueMetric2.name] ?? "Unknown"; // Same for valueMetric2

                    const popupContent = `${value1} has ${value2} impressions`; // Format the popup content

                    return {
                        position: [point[latDim.name], point[lonDim.name]], // Extract lat, lon
                        popupContent,
                    };
                });

            setMarkers(newMarkers);
        }
    }, [isLoading, error, data, latDim, lonDim, valueMetric1, valueMetric2]);


    return (
        <MapContainer
            center={[51.505, -0.09]} // Default center if no data is available
            zoom={2} // Default zoom level
            scrollWheelZoom={true} // Enable zooming with the mouse wheel
            style={{ width: '100%', height: '400px' }} // Set map size
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers.map((marker, index) => (
                <Marker
                    key={index}
                    position={marker.position}
                    icon={ // Custom icon for the marker with the #f04b55 color
                        new DivIcon({
                            className: 'leaflet-div-icon', // Apply custom class for styling
                            iconSize: [10, 10], // Circle size
                            iconAnchor: [5, 5], // Position the circle at the center
                            popupAnchor: [0, -10], // Position the popup above the marker
                            html: `<div style="background-color: #f04b55; width: 10px; height: 10px; border-radius: 50%;"></div>` // Circle style with your color
                        })
                    }
                >
                    <Popup>{marker.popupContent}</Popup> {/* Show valueMetric1 and valueMetric2 in popup */}
                </Marker>
            ))}
            <FitMapBounds markers={markers} /> {/* Adjust the map view to fit markers */}
        </MapContainer>
    );
};

export default GeoMap;
