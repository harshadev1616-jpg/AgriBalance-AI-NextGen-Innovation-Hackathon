from dataclasses import dataclass
from statistics import mean


KARNATAKA_DISTRICTS = [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayapura",
    "Yadgir",
]


CROP_PROFILES = {
    "Rice": {"yield": 48, "price": 2400, "cost": 62000, "water": 92, "demand": 74, "rainfall": 860},
    "Ragi": {"yield": 21, "price": 4300, "cost": 33000, "water": 34, "demand": 84, "rainfall": 520},
    "Jowar": {"yield": 19, "price": 3900, "cost": 30000, "water": 30, "demand": 78, "rainfall": 470},
    "Maize": {"yield": 46, "price": 2250, "cost": 47000, "water": 54, "demand": 72, "rainfall": 650},
    "Tur Dal": {"yield": 12, "price": 7200, "cost": 36000, "water": 38, "demand": 89, "rainfall": 600},
    "Groundnut": {"yield": 18, "price": 6100, "cost": 44000, "water": 45, "demand": 81, "rainfall": 560},
    "Cotton": {"yield": 16, "price": 6900, "cost": 59000, "water": 64, "demand": 68, "rainfall": 720},
    "Sugarcane": {"yield": 820, "price": 340, "cost": 115000, "water": 98, "demand": 63, "rainfall": 950},
    "Tomato": {"yield": 260, "price": 1150, "cost": 72000, "water": 58, "demand": 48, "rainfall": 620},
    "Millets": {"yield": 18, "price": 5600, "cost": 31000, "water": 24, "demand": 91, "rainfall": 420},
}


DISTRICT_BASELINES = {
    "Mandya": {"rainfall": 685, "water": 76, "pattern": {"Rice": 36, "Sugarcane": 28, "Ragi": 15}},
    "Mysuru": {"rainfall": 760, "water": 72, "pattern": {"Rice": 28, "Ragi": 24, "Maize": 14}},
    "Belagavi": {"rainfall": 720, "water": 61, "pattern": {"Sugarcane": 24, "Maize": 18, "Groundnut": 16}},
    "Tumakuru": {"rainfall": 560, "water": 44, "pattern": {"Ragi": 30, "Groundnut": 19, "Jowar": 14}},
    "Raichur": {"rainfall": 490, "water": 41, "pattern": {"Rice": 31, "Cotton": 22, "Tur Dal": 13}},
    "Dharwad": {"rainfall": 650, "water": 53, "pattern": {"Jowar": 24, "Cotton": 18, "Maize": 16}},
    "Bengaluru Urban": {"rainfall": 820, "water": 49, "pattern": {"Tomato": 26, "Ragi": 18, "Maize": 10}},
}


@dataclass(frozen=True)
class CropScore:
    crop: str
    expected_yield: float
    expected_profit: int
    profit_score: int
    demand_score: int
    oversupply_risk: int
    water_usage_score: int
    climate_risk: int
    confidence: int
    recommendation: str
    reasoning: str


class AgricultureIntelligenceEngine:
    def crop_balancing(self, district, context=None):
        context = context or {}
        baseline = self._district_baseline(district)
        scores = [self._score_crop(crop, profile, baseline, context) for crop, profile in CROP_PROFILES.items()]
        ranked = sorted(scores, key=lambda item: (item.expected_profit, item.demand_score, -item.oversupply_risk), reverse=True)
        top = ranked[:5]
        risky = max(scores, key=lambda item: item.oversupply_risk)
        alternatives = [item.crop for item in ranked if item.oversupply_risk < 55 and item.crop != risky.crop][:3]
        return {
            "district": district,
            "nearby_districts": self.nearby_districts(district),
            "top_recommended_crops": [item.__dict__ for item in top],
            "avoid_crop": {
                "crop": risky.crop,
                "oversupply_risk": risky.oversupply_risk,
                "demand": self._label(risky.demand_score),
                "expected_profit": risky.expected_profit,
                "alternative_crops": alternatives,
                "recommendation": "Avoid" if risky.oversupply_risk >= 75 else "Monitor acreage",
            },
            "reasoning": self._portfolio_reasoning(district, top, risky),
            "model": "phase2-crop-balancing-v1",
        }

    def district_heatmap(self):
        records = []
        for district in KARNATAKA_DISTRICTS:
            baseline = self._district_baseline(district)
            recommendation = self.crop_balancing(district)["top_recommended_crops"][0]
            risk_index = round((recommendation["oversupply_risk"] * 0.45) + (recommendation["climate_risk"] * 0.35) + ((100 - baseline["water"]) * 0.2))
            profit_index = recommendation["profit_score"]
            records.append(
                {
                    "district": district,
                    "profit_index": profit_index,
                    "risk_index": risk_index,
                    "water_availability": baseline["water"],
                    "rainfall": baseline["rainfall"],
                    "best_crop": recommendation["crop"],
                    "crop_diversity": self._diversity_score(baseline["pattern"]),
                    "expected_demand": recommendation["demand_score"],
                    "expected_supply": min(100, 35 + recommendation["oversupply_risk"]),
                    "status": "green" if profit_index >= 72 and risk_index < 55 else "yellow" if risk_index < 72 else "red",
                }
            )
        return {"districts": records, "legend": {"green": "High profit", "yellow": "Moderate", "red": "High risk"}}

    def compare_districts(self, districts):
        districts = districts or ["Mandya", "Mysuru", "Belagavi", "Tumakuru"]
        return {
            "districts": [
                {
                    "district": district,
                    "weather": self._weather_snapshot(district),
                    "yield_index": self.crop_balancing(district)["top_recommended_crops"][0]["expected_yield"],
                    "profit": self.crop_balancing(district)["top_recommended_crops"][0]["expected_profit"],
                    "demand": self.crop_balancing(district)["top_recommended_crops"][0]["demand_score"],
                    "supply": self.crop_balancing(district)["top_recommended_crops"][0]["oversupply_risk"],
                    "water": self._district_baseline(district)["water"],
                    "recommended_crops": [item["crop"] for item in self.crop_balancing(district)["top_recommended_crops"][:3]],
                }
                for district in districts
            ]
        }

    def market_intelligence(self, district, crop):
        scored = self._score_crop(crop, CROP_PROFILES.get(crop, CROP_PROFILES["Millets"]), self._district_baseline(district), {})
        current_price = CROP_PROFILES.get(crop, CROP_PROFILES["Millets"])["price"]
        forecast = [round(current_price * factor) for factor in [1.01, 1.04, 0.98, 1.08, 1.12, 1.07]]
        crash_warning = scored.oversupply_risk > 72 and scored.demand_score < 60
        return {
            "district": district,
            "crop": crop,
            "price_forecast": [{"month": month, "price": price} for month, price in zip(["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"], forecast)],
            "demand": scored.demand_score,
            "supply": min(100, scored.oversupply_risk + 22),
            "market_saturation": scored.oversupply_risk,
            "price_crash_warning": crash_warning,
            "high_demand_alert": scored.demand_score >= 78,
            "best_selling_window": "Dec-Jan" if not crash_warning else "Sell early before local arrivals peak",
        }

    def farmer_assistant(self, question, district="Mandya", farm_size=2.0):
        intelligence = self.crop_balancing(district)
        best = intelligence["top_recommended_crops"][0]
        lower_question = question.lower()
        if "tomato" in lower_question and "risky" in lower_question:
            tomato = self._score_crop("Tomato", CROP_PROFILES["Tomato"], self._district_baseline(district), {})
            answer = f"Tomato has {tomato.oversupply_risk}% oversupply risk in {district}. Prefer {best['crop']} for a stronger income-risk balance."
        elif "profit" in lower_question:
            answer = f"For {farm_size} hectares in {district}, {best['crop']} can net about Rs {round(best['expected_profit'] * farm_size):,} before financing and transport costs."
        elif "water" in lower_question:
            answer = f"{best['crop']} is suitable because its water usage score is {best['water_usage_score']}/100 against local availability of {self._district_baseline(district)['water']}/100."
        else:
            answer = f"Grow {best['crop']} in {district}. It scores {best['profit_score']}/100 for profit with {best['oversupply_risk']}% oversupply risk."
        return {"question": question, "answer": answer, "supporting_crops": intelligence["top_recommended_crops"][:3]}

    def notifications(self, district):
        baseline = self._district_baseline(district)
        best = self.crop_balancing(district)["top_recommended_crops"][0]
        alerts = [
            self._alert("Water Shortage", "high" if baseline["water"] < 45 else "medium", baseline["water"] < 55, "Shift acreage toward millets, pulses, and drip-supported crops."),
            self._alert("Price Crash", "high", best["oversupply_risk"] > 75, f"Limit new {best['crop']} sowing until market arrivals normalize."),
            self._alert("High Demand", "medium", best["demand_score"] > 82, f"{best['crop']} has strong forward demand."),
            self._alert("Drought", "high", baseline["rainfall"] < 520, "Activate irrigation scheduling and drought insurance checks."),
            self._alert("Heavy Rain", "medium", baseline["rainfall"] > 850, "Prepare drainage and disease monitoring."),
            self._alert("Pest Risk", "medium", best["climate_risk"] > 55, "Increase field scouting frequency."),
            self._alert("Disease Risk", "medium", baseline["rainfall"] > 760, "Track humidity-sensitive crop disease advisories."),
        ]
        return {"district": district, "alerts": [alert for alert in alerts if alert["active"]]}

    def profit_calculator(self, district, farm_size, budget, soil, water):
        best = self.crop_balancing(district, {"water_availability": water})["top_recommended_crops"][0]
        revenue = round((best["expected_yield"] * CROP_PROFILES[best["crop"]]["price"]) * farm_size)
        expenses = min(round(CROP_PROFILES[best["crop"]]["cost"] * farm_size), round(budget))
        net_profit = revenue - expenses
        return {
            "district": district,
            "recommended_crop": best["crop"],
            "farm_size": farm_size,
            "soil": soil,
            "water": water,
            "revenue": revenue,
            "expenses": expenses,
            "net_profit": net_profit,
            "roi": round((net_profit / expenses) * 100, 2) if expenses else 0,
            "risk": "High" if best["climate_risk"] > 65 or best["oversupply_risk"] > 70 else "Moderate" if best["climate_risk"] > 45 else "Low",
        }

    def satellite_analytics(self, district):
        baseline = self._district_baseline(district)
        vegetation_index = round(min(0.92, 0.38 + baseline["rainfall"] / 1800 + baseline["water"] / 500), 2)
        return {
            "district": district,
            "vegetation_index": vegetation_index,
            "crop_health": round(vegetation_index * 100),
            "drought_detection": baseline["rainfall"] < 520 or baseline["water"] < 42,
            "flood_detection": baseline["rainfall"] > 900,
            "growth_stage": "Vegetative" if vegetation_index < 0.7 else "Reproductive",
            "land_classification": "Irrigated cropland" if baseline["water"] > 65 else "Rainfed cropland",
        }

    def admin_analytics(self):
        heatmap = self.district_heatmap()["districts"]
        return {
            "total_farmers": 128640,
            "district_statistics": {"districts_monitored": len(heatmap), "high_risk_districts": sum(1 for item in heatmap if item["status"] == "red")},
            "crop_distribution": self._crop_distribution(),
            "profit_trends": [{"month": month, "index": value} for month, value in zip(["Aug", "Sep", "Oct", "Nov", "Dec"], [62, 66, 71, 74, 78])],
            "demand_trends": [{"month": month, "index": value} for month, value in zip(["Aug", "Sep", "Oct", "Nov", "Dec"], [58, 63, 69, 73, 80])],
            "weather_trends": [{"month": month, "rainfall": value} for month, value in zip(["Aug", "Sep", "Oct", "Nov", "Dec"], [112, 96, 74, 48, 22])],
            "market_trends": [{"month": month, "price_index": value} for month, value in zip(["Aug", "Sep", "Oct", "Nov", "Dec"], [91, 94, 89, 101, 108])],
            "export_reports": ["district-risk.csv", "crop-profit.pdf", "market-forecast.xlsx"],
        }

    def government_dashboard(self):
        heatmap = self.district_heatmap()["districts"]
        return {
            "district_production": [{"district": item["district"], "best_crop": item["best_crop"], "profit_index": item["profit_index"]} for item in heatmap[:12]],
            "crop_diversity": round(mean(item["crop_diversity"] for item in heatmap)),
            "food_security": round(mean(item["expected_demand"] for item in heatmap)),
            "water_usage": round(mean(100 - item["water_availability"] for item in heatmap)),
            "subsidy_suggestions": ["Millets in low-water districts", "Pulse seed support in northern districts", "Drip irrigation for sugarcane belts"],
            "emergency_alerts": [item for item in heatmap if item["status"] == "red"][:6],
        }

    def nearby_districts(self, district):
        index = KARNATAKA_DISTRICTS.index(district) if district in KARNATAKA_DISTRICTS else 0
        return [KARNATAKA_DISTRICTS[(index + offset) % len(KARNATAKA_DISTRICTS)] for offset in [1, 2, -1]]

    def _score_crop(self, crop, profile, baseline, context):
        rainfall = float(context.get("rainfall", baseline["rainfall"]))
        water = float(context.get("water_availability", baseline["water"]))
        market_price = float(context.get("current_market_price", profile["price"]))
        demand = min(100, round(profile["demand"] + (market_price - profile["price"]) / max(profile["price"], 1) * 20))
        pattern_share = baseline["pattern"].get(crop, 8)
        oversupply = min(97, round(pattern_share * 2.25 + max(0, 70 - demand) * 0.8))
        water_score = max(0, min(100, round(100 - max(0, profile["water"] - water) * 1.4)))
        climate_risk = max(0, min(100, round(abs(profile["rainfall"] - rainfall) / 9 + max(0, profile["water"] - water) * 0.45)))
        expected_yield = round(profile["yield"] * (0.75 + water_score / 330 + (100 - climate_risk) / 420), 2)
        profit = round(expected_yield * market_price - profile["cost"])
        profit_score = max(0, min(100, round((profit + 45000) / 1450)))
        confidence = max(48, min(96, round(profit_score * 0.35 + demand * 0.25 + water_score * 0.2 + (100 - climate_risk) * 0.2)))
        recommendation = "Strong Buy" if profit_score >= 72 and oversupply < 55 else "Grow Carefully" if oversupply < 75 else "Avoid"
        return CropScore(
            crop=crop,
            expected_yield=expected_yield,
            expected_profit=profit,
            profit_score=profit_score,
            demand_score=demand,
            oversupply_risk=oversupply,
            water_usage_score=water_score,
            climate_risk=climate_risk,
            confidence=confidence,
            recommendation=recommendation,
            reasoning=f"{crop} balances demand {demand}/100, water fit {water_score}/100, and local crop concentration {pattern_share}%.",
        )

    def _district_baseline(self, district):
        if district in DISTRICT_BASELINES:
            return DISTRICT_BASELINES[district]
        seed = sum(ord(char) for char in district)
        crops = list(CROP_PROFILES.keys())
        return {
            "rainfall": 480 + seed % 430,
            "water": 38 + seed % 42,
            "pattern": {crops[seed % len(crops)]: 22, crops[(seed + 3) % len(crops)]: 16, crops[(seed + 6) % len(crops)]: 12},
        }

    def _portfolio_reasoning(self, district, top, risky):
        return (
            f"{district} should diversify acreage toward {top[0].crop}, {top[1].crop}, and {top[2].crop}. "
            f"{risky.crop} shows the highest oversupply signal, so acreage expansion should be capped."
        )

    def _weather_snapshot(self, district):
        baseline = self._district_baseline(district)
        return {"rainfall": baseline["rainfall"], "humidity": 48 + baseline["rainfall"] % 36, "temperature": 22 + (100 - baseline["water"]) / 8}

    def _diversity_score(self, pattern):
        return max(35, min(100, round(100 - max(pattern.values()) * 1.35)))

    def _label(self, score):
        if score >= 75:
            return "High"
        if score >= 55:
            return "Moderate"
        return "Low"

    def _alert(self, title, severity, active, action):
        return {"title": title, "severity": severity, "active": active, "action": action}

    def _crop_distribution(self):
        totals = {}
        for district in KARNATAKA_DISTRICTS:
            for crop, share in self._district_baseline(district)["pattern"].items():
                totals[crop] = totals.get(crop, 0) + share
        return [{"crop": crop, "share": share} for crop, share in sorted(totals.items(), key=lambda item: item[1], reverse=True)]
