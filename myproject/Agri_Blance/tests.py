from django.test import TestCase

from .services.intelligence import AgricultureIntelligenceEngine


class ProfitCalculatorTests(TestCase):
    def test_profit_uses_latest_yield_price_area_and_costs(self):
        result = AgricultureIntelligenceEngine().profit_calculator(
            district="Mandya",
            crop="Tomato",
            farm_size=1,
            budget=15000,
            soil="Loamy",
            water=60,
            yield_per_hectare=1000,
            selling_price=30,
            seed_cost=5000,
            fertilizer_cost=4000,
            labor_cost=3000,
            irrigation_cost=2000,
            other_cost=1000,
        )

        self.assertEqual(result["revenue"], 30000)
        self.assertEqual(result["expenses"], 15000)
        self.assertEqual(result["net_profit"], 15000)

    def test_profit_changes_when_selling_price_changes(self):
        engine = AgricultureIntelligenceEngine()
        base_payload = {
            "district": "Mandya",
            "crop": "Tomato",
            "farm_size": 1,
            "budget": 15000,
            "soil": "Loamy",
            "water": 60,
            "yield_per_hectare": 1000,
            "seed_cost": 5000,
            "fertilizer_cost": 4000,
            "labor_cost": 3000,
            "irrigation_cost": 2000,
            "other_cost": 1000,
        }

        result_at_30 = engine.profit_calculator(**base_payload, selling_price=30)
        result_at_40 = engine.profit_calculator(**base_payload, selling_price=40)

        self.assertEqual(result_at_30["net_profit"], 15000)
        self.assertEqual(result_at_40["revenue"], 40000)
        self.assertEqual(result_at_40["net_profit"], 25000)
