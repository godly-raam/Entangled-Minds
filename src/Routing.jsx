// src/Routing.jsx

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { solveVrp } from './utils/api'; // Import our new API client!
import { Zap } from "lucide-react";

// (Leaflet Icon setup)
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
const depotIcon = L.divIcon({ className: 'depot-icon', html: 'D', iconSize: [20, 20] });


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

  const routeColors = ['#6366f1', '#f43f5e', '#22c55e', '#f97316']; // Indigo, Rose, Green, Orange

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      <div className="w-80 bg-gray-900 shadow-2xl z-10 flex flex-col border-r border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Zap className="text-black" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Q-Fleet Optimizer</h1>
              <p className="text-sm text-gray-400">Quantum VRP Solver</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Locations</label>
                <input type="range" min="2" max="8" value={numLocations} onChange={(e) => setNumLocations(parseInt(e.target.value))} />
                <span className="text-white">{numLocations}</span>
            </div>
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Vehicles</label>
                <input type="range" min="1" max="4" value={numVehicles} onChange={(e) => setNumVehicles(parseInt(e.target.value))} />
                <span className="text-white">{numVehicles}</span>
            </div>
             <div className="space-y-3">
                <label className="text-sm font-medium text-white">QAOA Quality (reps)</label>
                <input type="range" min="1" max="8" value={reps} onChange={(e) => setReps(parseInt(e.target.value))} />
                <span className="text-white">{reps}</span>
            </div>
          <button onClick={handleOptimize} disabled={loading} className="w-full p-4 rounded-xl font-semibold bg-white text-black">
            {loading ? 'Optimizing...' : 'Optimize Fleet Routes'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><p className="text-white text-lg">🔄 Contacting quantum backend...</p></div>}
        {error && <div className="absolute top-4 left-4 bg-red-500 text-white p-4 rounded-lg z-20">❌ Error: {error}</div>}
        
        <MapContainer center={[16.5, 80.5]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 1 }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {result && result.coordinates.map((coord, index) => (
            <Marker key={index} position={coord} icon={index === 0 ? depotIcon : DefaultIcon}></Marker>
          ))}
          {result && result.routes.map((route, index) => {
            if (!route || route.length < 2) return null;
            const routeCoords = route.map(nodeIndex => result.coordinates[nodeIndex]);
            return <Polyline key={index} positions={routeCoords} color={routeColors[index % routeColors.length]} weight={5} />;
          })}
        </MapContainer>
        
        {result && (
          <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-80 p-4 rounded-lg text-white max-w-md z-20">
            <h3 className="font-bold text-lg">Optimization Complete</h3>
            <p><strong>Method:</strong> {result.solution_method}</p>
            <p><strong>Total Distance:</strong> {result.total_distance.toFixed(2)}</p>
            <p><strong>Notes:</strong> {result.notes}</p>
            <hr className="my-2 border-gray-600"/>
            {result.routes.map((route, index) => (
              <p key={index} style={{ color: routeColors[index % routeColors.length] }}>
                <strong>Vehicle {index + 1}:</strong> {route.join(' → ')}
                <em> (Dist: {result.distances[index].toFixed(2)})</em>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}