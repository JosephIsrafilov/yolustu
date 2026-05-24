from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import httpx
import json
import logging

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser, get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


class LocationCoords(BaseModel):
    lat: float
    lng: float


class PricingSuggestionRequest(BaseModel):
    origin: str
    destination: str
    departure_time: str
    departure_date: str | None = None
    language: str = "az"
    origin_coords: LocationCoords | None = None
    destination_coords: LocationCoords | None = None
    car_model: str | None = None
    seats_total: int | None = None


class PricingSuggestionResponse(BaseModel):
    suggested_price: int
    reasoning: str


class VehicleValidationRequest(BaseModel):
    brand: str
    model: str


class VehicleValidationResponse(BaseModel):
    is_valid: bool
    brand: str
    model: str
    reason: str


async def get_driving_route(origin: LocationCoords, destination: LocationCoords):
    """Fetch exact driving distance and duration from OSRM"""
    try:
        # OSRM expects lon,lat
        url = f"https://router.project-osrm.org/route/v1/driving/{origin.lng},{origin.lat};{destination.lng},{destination.lat}?overview=false"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("routes") and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    distance_km = route["distance"] / 1000.0
                    duration_min = route["duration"] / 60.0
                    return distance_km, duration_min
    except Exception as e:
        logger.warning(f"OSRM routing failed: {e}")
    return None, None


@router.post("/pricing-suggestion", response_model=PricingSuggestionResponse)
async def get_smart_pricing_suggestion(
    request: PricingSuggestionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if not settings.NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key is missing.")

    distance_km, duration_min = None, None
    if request.origin_coords and request.destination_coords:
        distance_km, duration_min = await get_driving_route(
            request.origin_coords, request.destination_coords
        )

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.NVIDIA_API_KEY,
    )

    # Load market rates
    try:
        import os

        base_dir = os.path.dirname(os.path.abspath(__file__))
        with open(
            os.path.join(base_dir, "market_rates.json"), "r", encoding="utf-8"
        ) as f:
            market_rates = json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load market rates: {e}")
        market_rates = {}

    def normalize_city(name: str) -> str:
        # Simple normalization for matching
        mapping = {"ə": "a", "ö": "o", "ğ": "g", "ü": "u", "ş": "s", "ç": "c", "ı": "i"}
        name = name.lower()
        for k, v in mapping.items():
            name = name.replace(k, v)
        return name

    origin_norm = normalize_city(request.origin)
    dest_norm = normalize_city(request.destination)
    route_key = f"{origin_norm}-{dest_norm}"
    reverse_route_key = f"{dest_norm}-{origin_norm}"

    baseline_price = None
    # Check normalized keys
    for k, v in market_rates.items():
        k_norm = normalize_city(k)
        if k_norm == route_key or k_norm == reverse_route_key:
            baseline_price = v
            break

    if not baseline_price and distance_km:
        # Fallback based on tiered logic instead of flat 0.05
        if distance_km < 30:
            # Short trips inside city or nearby suburbs
            baseline_price = int(max(distance_km * 0.10, 1))
        else:
            # Longer intercity trips
            baseline_price = int(max(distance_km * 0.06, 1))

    # Time Context
    time_context = "Standard Time"
    try:
        if request.departure_time:
            h, m = map(int, request.departure_time.split(":"))
            total_minutes = h * 60 + m
            if (7 * 60 + 30 <= total_minutes <= 9 * 60 + 30) or (17 * 60 + 30 <= total_minutes <= 20 * 60):
                time_context = "Rush Hour"
            elif (total_minutes >= 23 * 60) or (total_minutes <= 5 * 60):
                time_context = "Night Trip"
    except Exception:
        pass

    # Day Context
    day_context = "Weekday"
    try:
        if request.departure_date:
            from datetime import datetime
            dt = datetime.strptime(request.departure_date, "%Y-%m-%d")
            if dt.weekday() >= 5: # 5 is Saturday, 6 is Sunday
                day_context = "Weekend"
    except Exception:
        pass

    # Vehicle Categorization
    car_model = request.car_model.strip() if request.car_model else "Standard Vehicle"
    vehicle_category = "Standard"
    premium_brands = ["mercedes", "bmw", "audi", "lexus", "land rover", "porsche", "tesla"]
    car_model_lower = car_model.lower()
    for brand in premium_brands:
        if brand in car_model_lower:
            vehicle_category = "Premium"
            break

    details = (
        f"Route: {request.origin} to {request.destination}\n"
        f"Departure Date: {request.departure_date or 'Unknown'} ({day_context})\n"
        f"Departure Time: {request.departure_time} ({time_context})\n"
    )

    if baseline_price:
        details += (
            f"BASELINE MARKET PRICE FOR THIS ROUTE: {baseline_price} AZN per seat.\n"
        )

    if distance_km and duration_min:
        details += f"Driving Distance: {distance_km:.1f} km\n"
        details += f"Estimated Driving Time: {int(duration_min // 60)}h {int(duration_min % 60)}m\n"

    details += f"Vehicle: {car_model} (Category: {vehicle_category})\n"

    seats = request.seats_total or 3
    details += f"Passenger Seats Available: {seats}\n"

    lang_map = {
        "az": "Azerbaijani",
        "ru": "Russian",
        "en": "English"
    }
    requested_language = lang_map.get(request.language.lower(), "Azerbaijani")

    prompt = (
        "You are an expert pricing AI for the Yolüstü carpooling app in Azerbaijan. "
        "Your task is to recommend a fair, competitive price for ONE SEAT on the requested trip in AZN (Azerbaijani Manat). "
        "Guidelines:\n"
        "1. DO NOT CALCULATE FUEL COSTS OR DISTANCES YOURSELF. Use the provided BASELINE MARKET PRICE as your strict anchor.\n"
        "2. If a BASELINE MARKET PRICE is provided, your final suggested price must be very close to it (within ±10-20%).\n"
        "3. Adjust the baseline slightly based on vehicle category: 'Premium' cars can charge slightly more. 'Standard' cars should stick closer to the baseline.\n"
        "4. Adjust slightly for time context (e.g., 'Night Trip' or 'Rush Hour' and 'Weekend' might carry a slight premium).\n\n"
        "Trip Details:\n"
        f"{details}\n"
        "Return the output STRICTLY as a JSON object with two fields:\n"
        "1. 'suggested_price': an integer representing the price for ONE seat in AZN.\n"
        f"2. 'reasoning': A highly specific 1-2 sentence explanation in {requested_language} citing the baseline market rate, car model impact, and time of travel.\n"
        "Do not include markdown blocks like ```json, just the raw JSON."
    )

    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=False,
        )

        response_content = (completion.choices[0].message.content or "").strip()

        # Robust regex extraction of JSON
        import re

        clean_text = response_content.replace("```json", "").replace("```", "").strip()

        # Try to find the first flat JSON object
        match = re.search(r"\{[^{}]*\}", clean_text)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
        else:
            start_idx = clean_text.find("{")
            end_idx = clean_text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                data = json.loads(clean_text[start_idx : end_idx + 1])
            else:
                raise ValueError("No JSON object found in response")

        return PricingSuggestionResponse(
            suggested_price=int(data["suggested_price"]), reasoning=data["reasoning"]
        )
    except Exception as e:
        logger.error(f"AI pricing failed: {e}")
        raise HTTPException(
            status_code=500, detail="AI pricing recommendation failed to process."
        )


@router.post("/validate-vehicle", response_model=VehicleValidationResponse)
async def validate_vehicle(
    request: VehicleValidationRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if not settings.NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key is missing.")

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.NVIDIA_API_KEY,
    )

    prompt = (
        f"You are an expert in the automotive industry. A user wants to register a vehicle.\n"
        f"Brand entered: '{request.brand}'\n"
        f"Model entered: '{request.model}'\n\n"
        f"Task:\n"
        f"1. Check if this vehicle actually exists (ignore minor typos, but if it's completely fake like 'flying saucer', reject it).\n"
        f"2. If it's valid, normalize the brand and model to their correct official English names (e.g., 'тайота' -> 'Toyota', 'приус' -> 'Prius').\n"
        f"3. If the vehicle doesn't exist, generate a brief, professional error message (in Russian) explaining that the specified vehicle model was not found in the database. For example: 'Указанный автомобиль не найден. Пожалуйста, проверьте правильность написания марки и модели.'\n\n"
        f"Output MUST be STRICTLY a JSON object with NO markdown wrapping. Format:\n"
        f"{{\n"
        f'  "is_valid": true or false,\n'
        f'  "brand": "Normalized Brand",\n'
        f'  "model": "Normalized Model",\n'
        f'  "reason": "If invalid, put the error message here. If valid, leave empty string."\n'
        f"}}"
    )

    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=256,
            stream=False,
        )

        response_content = (completion.choices[0].message.content or "").strip()

        # Robust regex extraction of JSON
        import re

        # Remove any markdown code blocks
        clean_text = response_content.replace("```json", "").replace("```", "").strip()

        # Try to find the first flat JSON object
        match = re.search(r"\{[^{}]*\}", clean_text)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
        else:
            # Fallback to finding first { and last }
            start_idx = clean_text.find("{")
            end_idx = clean_text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                data = json.loads(clean_text[start_idx : end_idx + 1])
            else:
                raise ValueError("No JSON object found in response")

        return VehicleValidationResponse(
            is_valid=bool(data.get("is_valid")),
            brand=str(data.get("brand", "")),
            model=str(data.get("model", "")),
            reason=str(data.get("reason", "")),
        )
    except Exception as e:
        logger.error(f"AI vehicle validation failed: {e}")
        # Return fallback professional error message instead of crashing to 500
        return VehicleValidationResponse(
            is_valid=False,
            brand=request.brand,
            model=request.model,
            reason="Произошла ошибка при проверке автомобиля. Пожалуйста, попробуйте еще раз.",
        )
