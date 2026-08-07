from django.conf import settings

from .base import ApiClient


class MarketDataClient(ApiClient):
    base_url = "https://api.data.gov.in/resource"
    AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"

    def __init__(self):
        super().__init__(settings.DATA_GOV_API_KEY)

    def crop_prices(self, state="Karnataka", district=None, commodity=None, limit=50):
        params = {
            "format": "json",
            "limit": limit,
            "filters[state]": state,
        }
        if self.api_key:
            params["api-key"] = self.api_key
        if district:
            params["filters[district]"] = district
        if commodity:
            params["filters[commodity]"] = commodity
        data = self.get(self.AGMARKNET_RESOURCE_ID, params=params)
        records = data.get("records", [])
        return {
            "count": len(records),
            "records": records,
            "trend": self._trend(records),
        }

    def _trend(self, records):
        prices = []
        for record in records:
            value = record.get("modal_price") or record.get("modal price")
            try:
                prices.append(float(value))
            except (TypeError, ValueError):
                continue
        if not prices:
            return {"average_modal_price": None, "min": None, "max": None}
        return {
            "average_modal_price": round(sum(prices) / len(prices), 2),
            "min": min(prices),
            "max": max(prices),
        }
