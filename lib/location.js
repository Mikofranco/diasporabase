// src/utils/getUserLocation.js

/**
 * Fetches the user's location using the browser's Geolocation API.
 * @param {Object} [options={}] - Geolocation options (e.g., timeout, accuracy).
 * @returns {Promise<{coordinates: {lat: number, lng: number}, accuracy: number}>}
 * @throws {Error} If geolocation is not supported or permission is denied.
 */
export const getUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          coordinates: { lat: latitude, lng: longitude },
          accuracy, // Accuracy in meters
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while fetching location.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // Try for higher accuracy (e.g., GPS if available)
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // No cached position
        ...options, // Allow custom options to override defaults
      }
    );
  });
};

// export default getUserLocation;