from fastapi import APIRouter, HTTPException, Query
from database import get_pool
from models.scheme import UserProfile, MatchRequest
from services.matcher import is_eligible, explain_mismatch

router = APIRouter()


@router.post("/match")
async def match_schemes(request: MatchRequest):
    pool = get_pool()
    user = request.user_profile

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                scheme_id, name, name_ta, name_hi,
                ministry, benefit_type,
                benefit_amount, benefit_frequency,
                applicable_states, gender, caste_categories,
                min_age, max_age, max_income, occupation_types,
                documents_required, application_url,
                application_deadline, is_rolling
            FROM schemes
            WHERE active = TRUE
            ORDER BY name
            """
        )

    matched = []
    for row in rows:
        scheme = dict(row)
        if is_eligible(user, scheme):
            lang = request.language or "en"
            if lang == "ta" and scheme.get("name_ta"):
                display_name = scheme["name_ta"]
            elif lang == "hi" and scheme.get("name_hi"):
                display_name = scheme["name_hi"]
            else:
                display_name = scheme["name"]

            matched.append({
                "scheme_id":            scheme["scheme_id"],
                "name":                 display_name,
                "name_en":              scheme["name"],
                "ministry":             scheme["ministry"],
                "benefit_type":         scheme["benefit_type"],
                "benefit_amount":       scheme["benefit_amount"],
                "benefit_frequency":    scheme["benefit_frequency"],
                "application_url":      scheme["application_url"],
                "application_deadline": str(scheme["application_deadline"])
                                        if scheme["application_deadline"] else None,
                "is_rolling":           scheme["is_rolling"],
                "documents_required":   scheme["documents_required"],
            })

    return {
        "total":      len(matched),
        "schemes":    matched,
        "user_state": user.state,
    }


@router.get("/search")
async def search_schemes(q: str = Query(min_length=2)):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT scheme_id, name, name_ta, name_hi,
                   ministry, benefit_type,
                   benefit_amount, application_url, is_rolling
            FROM schemes
            WHERE active = TRUE
              AND (
                name ILIKE $1
                OR name_ta ILIKE $1
                OR name_hi ILIKE $1
                OR ministry ILIKE $1
              )
            ORDER BY name
            LIMIT 20
            """,
            f"%{q}%",
        )
    return {"query": q, "results": [dict(r) for r in rows]}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM schemes WHERE scheme_id = $1 AND active = TRUE",
            scheme_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme = dict(row)
    for date_field in ["application_deadline", "verified_at", "created_at", "updated_at"]:
        if scheme.get(date_field):
            scheme[date_field] = str(scheme[date_field])
    return scheme


@router.post("/check/{scheme_id}")
async def check_single_scheme(scheme_id: str, user: UserProfile):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM schemes WHERE scheme_id = $1 AND active = TRUE",
            scheme_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme = dict(row)
    eligible = is_eligible(user, scheme)
    reasons = [] if eligible else explain_mismatch(user, scheme)

    return {
        "scheme_id": scheme_id,
        "name":      scheme["name"],
        "eligible":  eligible,
        "reasons":   reasons,
    }