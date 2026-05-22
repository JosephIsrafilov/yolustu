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

    details = (
        f"Route: {request.origin} to {request.destination}\n"
        f"Departure Time: {request.departure_time}\n"
    )

    if distance_km and duration_min:
        details += f"Driving Distance: {distance_km:.1f} km\n"
        details += f"Estimated Driving Time: {int(duration_min // 60)}h {int(duration_min % 60)}m\n"
        # Basic fuel calculation context
        fuel_liters = (distance_km / 100) * 8.5  # Assuming ~8.5L/100km
        fuel_cost = fuel_liters * 1.00  # Assuming ~1.00 AZN per liter
        details += f"Estimated Total Fuel Cost: {fuel_cost:.1f} AZN\n"
    else:
        details += "Distance: Unknown (Use standard market rates for this route)\n"

    car_model = request.car_model.strip() if request.car_model else "Standard Vehicle"
    details += f"Vehicle: {car_model}\n"

    seats = request.seats_total or 3
    details += f"Passenger Seats Available: {seats}\n"

    prompt = (
        "You are an expert pricing AI for the Yolüstü carpooling app in Azerbaijan. "
        "Your task is to recommend a fair, competitive price for ONE SEAT on the requested trip in AZN (Azerbaijani Manat). "
        "Guidelines:\n"
        "1. Base the price on the driving distance, fuel cost, and market rates (e.g. Baku-Ganja ~15 AZN, Baku-Sumqayit ~3 AZN).\n"
        "2. The price should cover a portion of the fuel and wear-and-tear, but remain cheaper than a solo taxi.\n"
        "3. Consider the vehicle quality: premium cars (e.g. Mercedes S-Class, BMW 5-series) can charge ~20-30% more. Older/budget cars should charge less.\n"
        "4. Consider the departure time: night trips or rush hours might carry a slight premium.\n\n"
        "Trip Details:\n"
        f"{details}\n"
        "Return the output STRICTLY as a JSON object with two fields:\n"
        "1. 'suggested_price': an integer representing the price for ONE seat in AZN.\n"
        "2. 'reasoning': A highly specific 1-2 sentence explanation citing the distance, estimated fuel, car model impact, and per-seat breakdown.\n"
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
