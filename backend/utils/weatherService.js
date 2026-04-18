/**
 * Weather Service — OpenWeatherMap API
 * 
 * Fetches current weather for a GPS location during diagnosis.
 * Weather data helps the score system understand crop conditions.
 * 
 * To enable:
 *   1. Sign up free at https://openweathermap.org/api
 *   2. Add OPENWEATHER_API_KEY=your_key to .env
 *   3. Free tier = 1000 calls/day
 */

const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Get current weather for a location.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object|null} Weather data or null if unavailable
 */
export async function getWeather(lat, lon) {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        console.log("⚠️  No OPENWEATHER_API_KEY set — skipping weather data");
        return null;
    }

    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error("Weather API error:", response.statusText);
            return null;
        }

        const data = await response.json();

        return {
            temperature: data.main?.temp,           // °C
            humidity: data.main?.humidity,            // %
            pressure: data.main?.pressure,           // hPa
            windSpeed: data.wind?.speed,             // m/s
            description: data.weather?.[0]?.description, // "light rain", "clear sky"
            condition: data.weather?.[0]?.main,      // "Rain", "Clear", "Clouds"
            rainfall: data.rain?.["1h"] || 0,        // mm in last 1 hour
            visibility: data.visibility,             // meters
            feelsLike: data.main?.feels_like,        // °C
            city: data.name || "Unknown",
        };
    } catch (error) {
        console.error("Weather Service error:", error.message);
        return null;
    }
}
