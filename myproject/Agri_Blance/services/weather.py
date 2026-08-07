from django.conf import settings

from .base import ApiClient


class OpenWeatherClient(ApiClient):
    base_url = "https://api.openweathermap.org/data/2.5"

    def __init__(self):
        super().__init__(settings.OPENWEATHER_API_KEY)

    def current_weather(self, latitude, longitude, units="metric"):
        self.require_key("OpenWeather")
        data = self.get(
            "weather",
            params={
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": units,
            },
        )
        return self._normalize_current(data)

    def five_day_forecast(self, latitude, longitude, units="metric"):
        self.require_key("OpenWeather")
        data = self.get(
            "forecast",
            params={
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": units,
            },
        )
        return {
            "city": data.get("city", {}),
            "items": [self._normalize_forecast_item(item) for item in data.get("list", [])],
        }

    def _normalize_current(self, data):
        return {
            "location": data.get("name"),
            "temperature": data.get("main", {}).get("temp"),
            "humidity": data.get("main", {}).get("humidity"),
            "wind_speed": data.get("wind", {}).get("speed"),
            "rainfall": data.get("rain", {}).get("1h", 0),
            "condition": (data.get("weather") or [{}])[0].get("description"),
            "raw": data,
        }

    def _normalize_forecast_item(self, item):
        return {
            "timestamp": item.get("dt_txt"),
            "temperature": item.get("main", {}).get("temp"),
            "humidity": item.get("main", {}).get("humidity"),
            "wind_speed": item.get("wind", {}).get("speed"),
            "rainfall": item.get("rain", {}).get("3h", 0),
            "condition": (item.get("weather") or [{}])[0].get("description"),
        }
