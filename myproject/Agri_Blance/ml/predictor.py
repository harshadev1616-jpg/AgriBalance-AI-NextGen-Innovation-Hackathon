class CropYieldPredictor:
    def predict(self, features):
        rainfall = float(features.get("rainfall", 0))
        temperature = float(features.get("temperature", 25))
        humidity = float(features.get("humidity", 60))
        nitrogen = float(features.get("nitrogen", 0))
        ph = float(features.get("ph", 6.5))
        market_price = float(features.get("market_price", 0))

        climate_score = max(0, 100 - abs(temperature - 27) * 4) * 0.35
        water_score = min(rainfall / 8, 100) * 0.25
        soil_score = max(0, 100 - abs(ph - 6.8) * 12) * 0.2
        nutrient_score = min(nitrogen / 20, 100) * 0.1
        demand_score = min(market_price / 50, 100) * 0.1

        confidence = round(min(climate_score + water_score + soil_score + nutrient_score + demand_score, 98), 2)
        expected_yield = round(18 + confidence * 0.42 + humidity * 0.04, 2)

        return {
            "expected_yield_quintal_per_hectare": expected_yield,
            "confidence": confidence,
            "recommendation": self._recommendation(confidence),
            "model": "baseline-agronomy-v1",
        }

    def _recommendation(self, confidence):
        if confidence >= 75:
            return "Strong conditions for cultivation with normal risk monitoring."
        if confidence >= 50:
            return "Moderate potential; improve soil nutrition and track rainfall closely."
        return "High risk; consider alternate crops, irrigation support, or delayed sowing."
