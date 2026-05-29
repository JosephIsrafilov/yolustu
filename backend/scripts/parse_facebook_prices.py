import os
import sys
import json
import logging
from openai import OpenAI
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables (NVIDIA_API_KEY)
# Assuming this script is run from backend folder or scripts folder
env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
)
load_dotenv(dotenv_path=env_path)

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    print("Error: NVIDIA_API_KEY not found in environment variables or .env file.")
    sys.exit(1)


def parse_text_with_ai(raw_text: str):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )

    prompt = (
        "You are an intelligent data extraction assistant. I will provide you with raw text copied from a carpooling Facebook group in Azerbaijan. "
        "Your goal is to identify all route pairs and their mentioned prices (in AZN/manat) and calculate a single median/average price for each unique route.\n\n"
        "Guidelines:\n"
        "1. Extract city names and normalize them to English characters (e.g. Bakı -> Baku, Lənkəran -> Lankaran, Gəncə -> Ganja, Şəki -> Shaki, Quba -> Quba, Sumqayıt -> Sumqayit).\n"
        "2. Find the prices mentioned for one seat on those routes.\n"
        "3. Ignore random numbers, phone numbers, or dates.\n"
        "4. Calculate an average if multiple posts mention the same route. Return the price as an integer.\n"
        "5. Standardize route keys as 'City1-City2'. (e.g. 'Baku-Lankaran'). Combine reverse routes (Lankaran-Baku) into the same average, but output both keys with the same price in the final JSON.\n\n"
        "Raw Text:\n"
        "==================\n"
        f"{raw_text}\n"
        "==================\n\n"
        "Return ONLY a valid JSON object where keys are the route strings (e.g. 'Baku-Lankaran') and values are the integer prices. Do not output anything else. Do not use markdown blocks."
    )

    print("Analyzing text with LLaMA-3.1...")
    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1024,
            stream=False,
        )

        response_content = (completion.choices[0].message.content or "").strip()

        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]

        return json.loads(response_content.strip())
    except Exception:
        logger.exception("Failed to parse Facebook prices with AI")
        return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "raw_fb_posts.txt")
    market_rates_file = os.path.join(
        os.path.dirname(script_dir), "app", "domains", "ai", "market_rates.json"
    )

    if not os.path.exists(input_file):
        print(f"Please create a file named 'raw_fb_posts.txt' in {script_dir}")
        print(
            "Paste the text you copied from Facebook into that file, then run this script again."
        )
        with open(input_file, "w", encoding="utf-8") as f:
            f.write("Paste Facebook posts here...")
        sys.exit(0)

    with open(input_file, "r", encoding="utf-8") as f:
        raw_text = f.read().strip()

    if not raw_text or raw_text == "Paste Facebook posts here...":
        print(
            "The file 'raw_fb_posts.txt' is empty or contains the placeholder text. Please paste real data."
        )
        sys.exit(1)

    extracted_data = parse_text_with_ai(raw_text)

    if not extracted_data:
        print("Failed to extract data.")
        sys.exit(1)

    print(f"Extracted {len(extracted_data)} routes.")

    # Merge with existing
    existing_data = {}
    if os.path.exists(market_rates_file):
        with open(market_rates_file, "r", encoding="utf-8") as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                logger.warning("Existing market rates file is invalid JSON; replacing it")

    for k, v in extracted_data.items():
        existing_data[k] = v
        print(f"Updated: {k} -> {v} AZN")

    with open(market_rates_file, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully updated {market_rates_file}")


if __name__ == "__main__":
    main()
