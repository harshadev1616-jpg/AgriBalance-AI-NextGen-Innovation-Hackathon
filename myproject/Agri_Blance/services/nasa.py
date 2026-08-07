from django.conf import settings

from .base import ApiClient


class NasaEarthClient(ApiClient):
    base_url = "https://api.nasa.gov/planetary/earth"

    def __init__(self):
        super().__init__(settings.NASA_API_KEY)

    def imagery(self, latitude, longitude, date=None, dim=0.12):
        self.require_key("NASA")
        params = {
            "lat": latitude,
            "lon": longitude,
            "dim": dim,
            "api_key": self.api_key,
        }
        if date:
            params["date"] = date
        data = self.get("imagery", params=params)
        return {
            "resource": data.get("resource"),
            "url": data.get("url"),
            "date": data.get("date"),
            "id": data.get("id"),
            "raw": data,
        }

    def assets(self, latitude, longitude, date_begin=None, date_end=None):
        self.require_key("NASA")
        params = {
            "lat": latitude,
            "lon": longitude,
            "api_key": self.api_key,
        }
        if date_begin:
            params["date"] = date_begin
        if date_end:
            params["end_date"] = date_end
        return self.get("assets", params=params)
