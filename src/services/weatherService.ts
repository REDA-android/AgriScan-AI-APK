export async function fetchWeatherData(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,uv_index&hourly=temperature_2m,relative_humidity_2m,vapour_pressure_deficit,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,shortwave_radiation_sum,uv_index_max&past_days=31&forecast_days=16&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return await res.json();
}
