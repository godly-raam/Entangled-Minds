// src/utils/api.js

// This URL must point to your live backend deployed on Render.
const API_BASE_URL = 'https://q-fleet-backend.onrender.com';

/**
 * Makes a POST request to the quantum VRP solver backend.
 * @param {object} problem - The problem definition.
 * @param {number} problem.num_locations - Number of delivery locations.
 * @param {number} problem.num_vehicles - Number of vehicles.
 * @param {number} problem.reps - QAOA repetitions for quality.
 * @returns {Promise<object>} - The optimization result from the backend.
 */
export async function solveVrp(problem) {
  const endpoint = '/api/optimize';
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

  try {
    console.log('🚀 Sending VRP problem to quantum backend:', problem);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(problem),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('✅ Received solution from backend:', result);
    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out. The Render service may be waking up.');
      throw new Error('Request timed out. The backend may be starting up, please try again in a minute.');
    }
    console.error('❌ Failed to fetch optimized routes:', error);
    throw error;
  }
}