from .base import ApiClient


class SoilGridsClient(ApiClient):
    base_url = "https://rest.isric.org/soilgrids/v2.0/properties/query"

    DEFAULT_PROPERTIES = ["phh2o", "soc", "nitrogen", "sand", "clay", "silt"]

    def soil_profile(self, latitude, longitude, properties=None):
        requested_properties = properties or self.DEFAULT_PROPERTIES
        data = self.get(
            params={
                "lat": latitude,
                "lon": longitude,
                "property": requested_properties,
                "depth": ["0-5cm", "5-15cm", "15-30cm"],
                "value": ["mean"],
            },
        )
        return {
            "latitude": latitude,
            "longitude": longitude,
            "properties": self._extract_properties(data),
            "raw": data,
        }

    def _extract_properties(self, data):
        layers = data.get("properties", {}).get("layers", [])
        result = {}
        for layer in layers:
            name = layer.get("name")
            result[name] = []
            for depth in layer.get("depths", []):
                result[name].append(
                    {
                        "depth": depth.get("label"),
                        "mean": depth.get("values", {}).get("mean"),
                        "unit": layer.get("unit_measure", {}).get("target_units"),
                    }
                )
        return result
