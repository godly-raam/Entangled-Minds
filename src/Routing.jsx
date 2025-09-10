// src/Routing.jsx

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { solveVrp } from './utils/api'; // We no longer import checkHealth
import { Zap, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- (Leaflet Icon setup) ---
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const depotIcon = L.divIcon({ 
    className: 'depot-icon', 
    html: 'D', 
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

export default function Routing() {
  // State for the user inputs
  const [numLocations, setNumLocations] = useState(4);
  const [numVehicles, setNumVehicles] = useState(2);
  const [reps, setReps] = useState(5);

  // State for the results and UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  // The 'backendStatus' state and the 'useEffect' for health check have been removed.

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
      {/* Sidebar Controls */}
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

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-white block mb-2">Locations: {numLocations}</label>
            <input type="range" className="w-full" min="2" max="8" value={numLocations} onChange={(e) => setNumLocations(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium text-white block mb-2">Vehicles: {numVehicles}</label>
            <input type="range" className="w-full" min="1" max="4" value={numVehicles} onChange={(e) => setNumVehicles(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium text-white block mb-2">QAOA Quality (reps): {reps}</label>
            <input type="range" className="w-full" min="1" max="8" value={reps} onChange={(e) => setReps(parseInt(e.target.value))} />
          </div>
          <button 
            onClick={handleOptimize} 
            disabled={loading} // Button is now only disabled when loading
            className="w-full p-4 mt-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all bg-white text-black disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Navigation size={20} />
              </motion.div>
            ) : <Zap size={20}/>}
            {loading ? 'Optimizing...' : 'Optimize Fleet Routes'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
              <div className="text-center text-white">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{display: 'inline-block'}}><Zap size={32}/></motion.div>
                <p className="text-lg mt-4">Contacting quantum backend...</p>
                <p className="text-sm text-gray-400">This may take up to a minute on first run.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MapContainer center={[16.5, 80.5]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 1, backgroundColor: '#111827' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
          
          {result && result.coordinates.map((coord, index) => (
            <Marker key={index} position={coord} icon={index === 0 ? depotIcon : DefaultIcon}>
                <Tooltip>Location {index} {index === 0 ? '(Depot)' : ''}</Tooltip>
            </Marker>
          ))}
          
          {result && result.routes.map((route, index) => {
            if (!route || route.length < 2) return null;
            const routeCoords = route.map(nodeIndex => result.coordinates[nodeIndex]);
            return <Polyline key={index} positions={routeCoords} color={routeColors[index % routeColors.length]} weight={5} opacity={0.8} />;
          })}
        </MapContainer>
        
        <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg text-white max-w-md z-20 border border-gray-700 shadow-2xl"
          >
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Optimization Complete</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${result.is_quantum_solution ? 'bg-indigo-500 text-white' : 'bg-yellow-500 text-black'}`}>{result.solution_method}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{result.notes}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                    <p className="text-2xl font-bold">{result.total_distance.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Total Distance</p>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">{result.execution_time.toFixed(2)}s</p>
                    <p className="text-xs text-gray-400">Execution Time</p>
                </div>
            </div>
            <hr className="my-3 border-gray-700"/>
            <div className="space-y-1">
            {result.routes.map((route, index) => (
              <div key={index} className="flex items-center text-sm">
                  <div className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: routeColors[index % routeColors.length]}}></div>
                  <strong>Vehicle {index + 1}:</strong> 
                  <span className="ml-2 font-mono">{route.join(' → ')}</span>
                  <em className="ml-auto text-gray-400">(Dist: {result.distances[index].toFixed(2)})</em>
              </div>
            ))}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
            {error && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800 text-white p-3 rounded-lg z-20 shadow-lg flex items-center gap-3"
            >
                <X size={20}/> <span>{error}</span>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}