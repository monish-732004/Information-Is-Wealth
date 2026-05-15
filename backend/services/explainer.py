from openai import AsyncOpenAI
from database import get_pool
from models.scheme import UserProfile
import os

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
}


async def get_scheme_from_db(scheme_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM schemes WHERE scheme_id = $1 AND active = TRUE",
            scheme_id
        )
    return dict(row) if row else None


async def explain_eligibility(scheme_id: str, user: UserProfile, language: str = "en") -> str:
    scheme = await get_scheme_from_db(scheme_id)
    if not scheme:
        return "Scheme not found."

    lang_name = LANGUAGE_NAMES.get(language, "English")

    prompt = f"""Explain in {lang_name} in 3-4 simple sentences why this citizen is eligible for the scheme '{scheme['name']}'.

Citizen profile:
- State: {user.state}
- Gender: {user.gender}
- Category: {user.caste_category}
- Age: {user.age} years
- Income: Rs {user.income_annual}/year
- Occupation: {user.occupation_type.replace('_', ' ')}

Scheme benefit: {f"Rs {scheme['benefit_amount']:,} {scheme['benefit_frequency']}" if scheme.get('benefit_amount') else "varies by case"}

Be warm, encouraging, and use simple everyday language. No jargon. Respond only in {lang_name}."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


async def explain_how_to_apply(scheme_id: str, language: str = "en") -> str:
    scheme = await get_scheme_from_db(scheme_id)
    if not scheme:
        return "Scheme not found."

    lang_name = LANGUAGE_NAMES.get(language, "English")
    docs = scheme.get("documents_required") or []
    docs_str = ", ".join(docs) if docs else "basic identity documents"

    prompt = f"""In {lang_name}, give 4-6 simple steps to apply for the scheme '{scheme['name']}'.

Documents needed: {docs_str}
Apply at: {scheme.get('application_url') or 'the official government portal'}
Deadline: {scheme.get('application_deadline') or 'No deadline - rolling applications'}

Use Step 1:, Step 2: format. One sentence per step. Simple language only. No jargon. Respond only in {lang_name}."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.5,
    )
    return response.choices[0].message.content.strip()