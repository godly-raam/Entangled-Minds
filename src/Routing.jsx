// src/Routing.jsx

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { solveVrp } from './utils/api'; // Import our new API client

// --- (Leaflet Icon setup) ---
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
const depotIcon = L.divIcon({ className: 'depot-icon', html: 'D', iconSize: [25, 25] });

export default function Routing() {
  // State for the inputs
  const [numLocations, setNumLocations] = useState(4);
  const [numVehicles, setNumVehicles] = useState(2);
  const [reps, setReps] = useState(5);

  // State for the results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const problem = {
      num_locations: numLocations,
      num_vehicles: numVehicles,
      reps: reps,
    };

    try {
      const response = await solveVrp(problem);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const routeColors = ['#FF0000', '#0000FF', '#008000', '#FFA500']; // Red, Blue, Green, Orange

  return (
    <div className="main-container">
      <div className="sidebar">
        <h1>Q-Fleet Optimizer ⚛️</h1>
        <div className="controls">
          <label>Number of Locations:</label>
          <input type="number" value={numLocations} onChange={(e) => setNumLocations(parseInt(e.target.value))} min="2" max="8" />
        </div>
        <div className="controls">
          <label>Number of Vehicles:</label>
          <input type="number" value={numVehicles} onChange={(e) => setNumVehicles(parseInt(e.target.value))} min="1" max="4" />
        </div>
        <div className="controls">
          <label>QAOA Quality (reps):</label>
          <input type="number" value={reps} onChange={(e) => setReps(parseInt(e.target.value))} min="1" max="8" />
        </div>
        <button onClick={handleOptimize} disabled={loading}>
          {loading ? 'Solving...' : 'Optimize Routes'}
        </button>
      </div>

      <div className="content">
        {loading && <p className="loading-message">🔄 Contacting quantum backend...</p>}
        {error && <p className="error-message">❌ Error: {error}</p>}
        
        {result ? (
          <div className="results-and-map">
            <div className="results-summary">
              <h2>Optimization Results</h2>
              <p><strong>Solution Method:</strong> {result.solution_method}</p>
              <p><strong>Notes:</strong> {result.notes}</p>
              <p><strong>Total Distance:</strong> {result.total_distance.toFixed(2)}</p>
              <div>
                {result.routes.map((route, index) => (
                  <p key={index} style={{ color: routeColors[index % routeColors.length] }}>
                    <strong>Vehicle {index + 1}:</strong> {route.join(' → ')}
                    <em> (Distance: {result.distances[index].toFixed(2)})</em>
                  </p>
                ))}
              </div>
            </div>
            <MapContainer center={[16.5, 80.5]} zoom={11} style={{ height: '600px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {result.coordinates.map((coord, index) => (
                <Marker key={index} position={coord} icon={index === 0 ? depotIcon : DefaultIcon}>
                </Marker>
              ))}
              {result.routes.map((route, index) => {
                if (!route) return null;
                const routeCoords = route.map(nodeIndex => result.coordinates[nodeIndex]);
                return <Polyline key={index} positions={routeCoords} color={routeColors[index % routeColors.length]} />;
              })}
            </MapContainer>
          </div>
        ) : (
          <div className="placeholder">
            <p>Set your parameters and click "Optimize Routes" to see the solution.</p>
          </div>
        )}
      </div>
    </div>
  );
}