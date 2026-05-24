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


class DescriptionGenerationRequest(BaseModel):
    origin: str
    destination: str
    departure_time: str
    departure_date: str | None = None
    car_model: str | None = None
    seats_total: int | None = None
    language: str = "az"
    preferences: list[str] | None = None


class DescriptionGenerationResponse(BaseModel):
    description: str


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
    distance_km, duration_min = None, None
    if request.origin_coords and request.destination_coords:
        distance_km, duration_min = await get_driving_route(
            request.origin_coords, request.destination_coords
        )

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
        mapping = {"ə": "a", "ö": "o", "ğ": "g", "ü": "u", "ş": "s", "ç": "c", "ı": "i"}
        name = name.lower()
        for k, v in mapping.items():
            name = name.replace(k, v)
        aliases = {
            "baki": "baku", "gence": "ganja", "lenkeran": "lankaran", "seki": "shaki",
            "samaxi": "shamakhi", "qebele": "gabala", "xacmaz": "khachmaz", "qusar": "gusar",
            "semkir": "shamkir", "berde": "barda", "agdam": "aghdam", "kurdemir": "kurdamir",
            "agdas": "aghdash", "agcabedi": "aghjabadi", "xizi": "khizi", "siyezen": "siyazan",
            "mingecevir": "mingachevir", "sirvan": "shirvan", "goycay": "goychay",
            "fuzuli": "fuzuli", "celilabad": "jalilabad", "haciqabul": "hajigabul",
            "neftcala": "neftchala", "masalli": "masalli", "yardimli": "yardimli",
            "agsu": "agsu", "balaken": "balakan", "qax": "gakh", "oguz": "oguz",
            "daskesen": "dashkasan", "gedebey": "gadabay", "goranboy": "goranboy",
            "goygol": "goygol", "sabirabad": "sabirabad", "saatli": "saatli",
            "salyan": "salyan", "astara": "astara", "tartar": "tartar",
            "beylaqan": "beylagan", "bilasuvar": "bilasuvar", "abseron": "absheron",
            "sabran": "shabran",
        }
        return aliases.get(name, name)

    origin_norm = normalize_city(request.origin)
    dest_norm = normalize_city(request.destination)
    route_key = f"{origin_norm}-{dest_norm}"
    reverse_route_key = f"{dest_norm}-{origin_norm}"

    baseline_price = None
    for k, v in market_rates.items():
        k_norm = normalize_city(k)
        if k_norm == route_key or k_norm == reverse_route_key:
            baseline_price = v
            break

    if not baseline_price:
        if distance_km:
            if distance_km < 30:
                baseline_price = max(distance_km * 0.10, 1.0)
            else:
                baseline_price = max(distance_km * 0.06, 1.0)
        else:
            baseline_price = 10.0

    time_multiplier = 1.0
    try:
        if request.departure_time:
            h, m = map(int, request.departure_time.split(":"))
            total_minutes = h * 60 + m
            if (7 * 60 + 30 <= total_minutes <= 9 * 60 + 30) or (
                17 * 60 + 30 <= total_minutes <= 20 * 60
            ):
                time_multiplier = 1.1
            elif (total_minutes >= 23 * 60) or (total_minutes <= 5 * 60):
                time_multiplier = 1.05
    except Exception:
        pass

    day_multiplier = 1.0
    try:
        if request.departure_date:
            from datetime import datetime
            dt = datetime.strptime(request.departure_date, "%Y-%m-%d")
            if dt.weekday() >= 5:  
                day_multiplier = 1.1
    except Exception:
        pass

    car_model = request.car_model.strip() if request.car_model else "Standard Vehicle"
    vehicle_multiplier = 1.0
    premium_brands = [
        "mercedes", "bmw", "audi", "lexus", "land rover", "porsche", "tesla",
    ]
    car_model_lower = car_model.lower()
    for brand in premium_brands:
        if brand in car_model_lower:
            vehicle_multiplier = 1.2
            break

    final_price = baseline_price * time_multiplier * day_multiplier * vehicle_multiplier
    suggested_price = int(round(final_price))

    lang = request.language.lower()
    reasoning_parts = []
    
    if lang == "az":
        base_msg = "Qiymət bazar ortalamasına və marşrut məsafəsinə əsasən hesablanıb."
        if vehicle_multiplier > 1.0: reasoning_parts.append("premium avtomobil")
        if time_multiplier > 1.0: reasoning_parts.append("pik saatlar")
        if day_multiplier > 1.0: reasoning_parts.append("həftəsonu")
        
        reasoning = base_msg
        if reasoning_parts:
            reasoning += f" ({', '.join(reasoning_parts)} nəzərə alınıb)."
    elif lang == "ru":
        base_msg = "Цена рассчитана на основе средних рыночных показателей и длины маршрута."
        if vehicle_multiplier > 1.0: reasoning_parts.append("премиум-класс")
        if time_multiplier > 1.0: reasoning_parts.append("час пик/ночь")
        if day_multiplier > 1.0: reasoning_parts.append("выходные")
        
        reasoning = base_msg
        if reasoning_parts:
            reasoning += f" (Учтены: {', '.join(reasoning_parts)})."
    else:
        base_msg = "Price is calculated based on market averages and route distance."
        if vehicle_multiplier > 1.0: reasoning_parts.append("premium vehicle")
        if time_multiplier > 1.0: reasoning_parts.append("rush hour/night")
        if day_multiplier > 1.0: reasoning_parts.append("weekend")
        
        reasoning = base_msg
        if reasoning_parts:
            reasoning += f" (Adjusted for: {', '.join(reasoning_parts)})."

    if settings.NVIDIA_API_KEY:
        try:
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=settings.NVIDIA_API_KEY,
            )
            
            min_price = int(round(suggested_price * 0.85))
            max_price = int(round(suggested_price * 1.15))

            prompt = (
                f"You are a transportation pricing assistant for the Yolustu carpooling platform in Azerbaijan.\n"
                f"Analyze the following trip and price details to calculate a final recommended price and provide a short explanation.\n\n"
                f"Trip Details:\n"
                f"- Route: {request.origin} -> {request.destination}\n"
                f"- Departure Time: {request.departure_time}\n"
                f"- Departure Date: {request.departure_date or 'Not specified'}\n"
                f"- Car model: {car_model}\n"
                f"- Seats: {request.seats_total or 4}\n"
                f"- Calculated baseline price: {suggested_price} AZN\n"
                f"- Requested language: {lang}\n\n"
                f"Instructions:\n"
                f"1. Generate a recommended price (integer) by adjusting the baseline price up or down by at most 15% (must be between {min_price} and {max_price} AZN inclusive). Choose a round, passenger-friendly number.\n"
                f"2. Write a brief, high-quality, professional, and natural explanation (1-2 sentences) in the requested language ({lang}) explaining this price recommendation (referencing comfort, day of week, or route length if relevant).\n"
                f"3. Return ONLY a valid JSON object. No markdown wrappers. Format:\n"
                f"{{\n"
                f'  "suggested_price": <integer_price>,\n'
                f'  "reasoning": "<explanation_string>"\n'
                f"}}"
            )

            completion = client.chat.completions.create(
                model="meta/llama-3.1-8b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=256,
                timeout=3.0,
                stream=False,
            )

            response_content = (completion.choices[0].message.content or "").strip()
            
            import re
            clean_text = response_content.replace("```json", "").replace("```", "").strip()
            match = re.search(r"\{[^{}]*\}", clean_text)
            if match:
                data = json.loads(match.group(0))
            else:
                start_idx = clean_text.find("{")
                end_idx = clean_text.rfind("}")
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    data = json.loads(clean_text[start_idx : end_idx + 1])
                else:
                    raise ValueError("No JSON object found")

            ai_price = data.get("suggested_price")
            ai_reasoning = data.get("reasoning")
            
            if ai_price is not None and isinstance(ai_price, (int, float)):
                ai_price_int = int(round(ai_price))
                if min_price <= ai_price_int <= max_price:
                    suggested_price = ai_price_int
                    
            if ai_reasoning and isinstance(ai_reasoning, str):
                reasoning = ai_reasoning.strip()

        except Exception as e:
            logger.warning(f"Nvidia NIM pricing calculation failed/timed out, falling back to deterministic: {e}")

    return PricingSuggestionResponse(
        suggested_price=suggested_price, 
        reasoning=reasoning
    )


@router.post("/generate-description", response_model=DescriptionGenerationResponse)
async def generate_trip_description(
    request: DescriptionGenerationRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    lang = request.language.lower()
    car = request.car_model or ("avtomobil" if lang == "az" else "автомобиль" if lang == "ru" else "car")
    
    if lang == "az":
        fallback_desc = f"Salam! {request.origin} - {request.destination} marşrutu üzrə gedirəm. Avtomobil: {car}. Rahat və təhlükəsiz səfər üçün qoşulun!"
    elif lang == "ru":
        fallback_desc = f"Привет! Еду по маршруту {request.origin} - {request.destination} на {car}. Присоединяйтесь для комфортной поездки!"
    else:
        fallback_desc = f"Hello! Driving from {request.origin} to {request.destination} in my {car}. Join me for a comfortable trip!"

    description = fallback_desc

    if settings.NVIDIA_API_KEY:
        try:
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=settings.NVIDIA_API_KEY,
            )
            
            prompt = (
                f"You are a friendly ride-sharing assistant for Yolustu platform.\n"
                f"Write a short, engaging description for a driver posting a trip.\n\n"
                f"Trip parameters:\n"
                f"- From: {request.origin}\n"
                f"- To: {request.destination}\n"
                f"- Departure time: {request.departure_time}\n"
                f"- Departure date: {request.departure_date or 'not specified'}\n"
                f"- Car: {request.car_model or 'Standard Car'}\n"
                f"- Available seats: {request.seats_total or 4}\n"
                f"- Preferences/Amenities: {', '.join(request.preferences) if request.preferences else 'none'}\n\n"
                f"Instructions:\n"
                f"1. Write the description from the driver's perspective (first-person singular/plural).\n"
                f"2. Language: Write entirely in the requested language: '{lang}'.\n"
                f"3. Make it short (2-3 sentences max) and welcoming.\n"
                f"4. Do NOT include markdown styling or surrounding quotes. Just return the raw text."
            )
            
            completion = client.chat.completions.create(
                model="meta/llama-3.1-8b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200,
                timeout=4.0,
                stream=False,
            )
            
            ai_desc = (completion.choices[0].message.content or "").strip()
            if ai_desc.startswith('"') and ai_desc.endswith('"'):
                ai_desc = ai_desc[1:-1].strip()
            
            if ai_desc:
                description = ai_desc
                
        except Exception as e:
            logger.warning(f"AI trip description generation failed/timed out, falling back: {e}")

    return DescriptionGenerationResponse(description=description)


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

        import re

        clean_text = response_content.replace("```json", "").replace("```", "").strip()

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

        return VehicleValidationResponse(
            is_valid=bool(data.get("is_valid")),
            brand=str(data.get("brand", "")),
            model=str(data.get("model", "")),
            reason=str(data.get("reason", "")),
        )
    except Exception as e:
        logger.error(f"AI vehicle validation failed: {e}")
        return VehicleValidationResponse(
            is_valid=False,
            brand=request.brand,
            model=request.model,
            reason="Произошла ошибка при проверке автомобиля. Пожалуйста, попробуйте еще раз.",
        )
