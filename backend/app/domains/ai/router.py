from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
import json

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser, get_current_user

router = APIRouter()

class PricingSuggestionRequest(BaseModel):
    origin: str
    destination: str
    departure_time: str

class PricingSuggestionResponse(BaseModel):
    suggested_price: int
    reasoning: str

@router.post("/pricing-suggestion", response_model=PricingSuggestionResponse)
def get_smart_pricing_suggestion(
    request: PricingSuggestionRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    if not settings.NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key is missing.")

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.NVIDIA_API_KEY,
    )

    prompt = (
        "You are an AI pricing analyst for an Azerbaijani carpooling application called Yolüstü. "
        "The currency is AZN. For context, typical intercity prices are around 10-20 AZN for long trips "
        "(e.g., Baku to Ganja is usually ~15 AZN) and 3-5 AZN for short trips (e.g., Baku to Sumqayit is ~3 AZN). "
        "Your goal is to suggest a competitive and fair price for a single seat in a car for the given route and time.\n\n"
        f"Origin: {request.origin}\n"
        f"Destination: {request.destination}\n"
        f"Departure Time: {request.departure_time}\n\n"
        "Return the output STRICTLY as a JSON object with two fields:\n"
        "1. 'suggested_price': an integer representing the AZN amount.\n"
        "2. 'reasoning': a short 1-sentence reasoning for this price.\n"
        "Do not include markdown blocks like ```json, just the raw JSON."
    )

    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=False
        )

        response_content = completion.choices[0].message.content.strip()
        
        # In case the model wrapped it in markdown
        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]
            
        data = json.loads(response_content.strip())
        return PricingSuggestionResponse(
            suggested_price=data["suggested_price"],
            reasoning=data["reasoning"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI pricing recommendation failed to process.")
