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
    origin_coords: LocationCoords | None = None
    destination_coords: LocationCoords | None = None
    car_model: str | None = None
    seats_total: int | None = None


class PricingSuggestionResponse(BaseModel):
    suggested_price: int
    reasoning: str


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
        with open(os.path.join(base_dir, "market_rates.json"), "r", encoding="utf-8") as f:
            market_rates = json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load market rates: {e}")
        market_rates = {}

    def normalize_city(name: str) -> str:
        # Simple normalization for matching
        mapping = {'ə': 'a', 'ö': 'o', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ç': 'c', 'ı': 'i'}
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
        # Fallback to 0.05 AZN per km for a standard trip if no market rate found
        baseline_price = int(max(distance_km * 0.05, 1))

    details = (
        f"Route: {request.origin} to {request.destination}\n"
        f"Departure Time: {request.departure_time}\n"
    )

    if baseline_price:
        details += f"BASELINE MARKET PRICE FOR THIS ROUTE: {baseline_price} AZN per seat.\n"

    if distance_km and duration_min:
        details += f"Driving Distance: {distance_km:.1f} km\n"
        details += f"Estimated Driving Time: {int(duration_min // 60)}h {int(duration_min % 60)}m\n"

    car_model = request.car_model.strip() if request.car_model else "Standard Vehicle"
    details += f"Vehicle: {car_model}\n"

    seats = request.seats_total or 3
    details += f"Passenger Seats Available: {seats}\n"

    prompt = (
        "You are an expert pricing AI for the Yolüstü carpooling app in Azerbaijan. "
        "Your task is to recommend a fair, competitive price for ONE SEAT on the requested trip in AZN (Azerbaijani Manat). "
        "Guidelines:\n"
        "1. DO NOT CALCULATE FUEL COSTS OR DISTANCES YOURSELF. Use the provided BASELINE MARKET PRICE as your strict anchor.\n"
        "2. If a BASELINE MARKET PRICE is provided, your final suggested price must be very close to it (within ±10-20%).\n"
        "3. Adjust the baseline slightly based on vehicle quality: premium cars (e.g. Mercedes S-Class, BMW 5-series) can charge slightly more. Older/budget cars should charge slightly less.\n"
        "4. Adjust slightly for departure time (e.g., night trips or rush hours might carry a slight premium).\n\n"
        "Trip Details:\n"
        f"{details}\n"
        "Return the output STRICTLY as a JSON object with two fields:\n"
        "1. 'suggested_price': an integer representing the price for ONE seat in AZN.\n"
        "2. 'reasoning': A highly specific 1-2 sentence explanation citing the baseline market rate, car model impact, and time of travel.\n"
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

        response_content = completion.choices[0].message.content.strip()

        # In case the model wrapped it in markdown
        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]

        data = json.loads(response_content.strip())
        return PricingSuggestionResponse(
            suggested_price=int(data["suggested_price"]), reasoning=data["reasoning"]
        )
    except Exception as e:
        logger.error(f"AI pricing failed: {e}")
        raise HTTPException(
            status_code=500, detail="AI pricing recommendation failed to process."
        )
