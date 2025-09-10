// src/utils/api.js

// This URL MUST point to your live backend deployed on Render.
const API_BASE_URL = 'https://q-fleet-backend.onrender.com';

/**
 * Makes a POST request to the quantum VRP solver backend.
 * This function is the bridge between your frontend and backend.
 * @param {object} problem - The problem definition from the UI.
 * @param {number} problem.num_locations - Number of delivery locations.
 * @param {number} problem.num_vehicles - Number of vehicles.
 * @param {number} problem.reps - QAOA repetitions for quality.
 * @returns {Promise<object>} - The optimization result from the backend.
 */
export async function solveVrp(problem) {
  const endpoint = '/api/optimize';
  const url = `${API_BASE_URL}${endpoint}`;
  
  // A robust timeout is crucial when dealing with potentially long-running computations.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

  try {
    console.log('🚀 Sending VRP problem to quantum backend:', problem);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(problem),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.detail || 'The server returned an error.'}`);
    }
    
    const result = await response.json();
    console.log('✅ Received solution from backend:', result);
    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out. The Render service may be waking up.');
      throw new Error('Request timed out. The backend is likely starting up, please try again in a minute.');
    }
    console.error('❌ Failed to fetch optimized routes:', error);
    throw error;
  }
}

/**
 * Checks the health of the backend API.
 * @returns {Promise<object>} - The health status from the backend.
 */
export async function checkHealth() {
    const url = `${API_BASE_URL}/api/health`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Backend is not responding.");
        return await response.json();
    } catch (error) {
        console.error("Health check failed:", error);
        throw error;
    }
}
