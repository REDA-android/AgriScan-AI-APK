## 2026-09-29 - [Sentinel] Fixed Unencrypted Transmission
**Vulnerability:** OpenWeatherMap API key transmitted over unencrypted HTTP (http://api.openweathermap.org)
**Learning:** Hardcoded external URLs need to be manually reviewed for http vs https. It is easy to leak API keys if sensitive parameters like `appid` are passed via query params to a non-HTTPS endpoint.
**Prevention:** Always use HTTPS for external API calls, especially when they involve API keys or sensitive user data.
