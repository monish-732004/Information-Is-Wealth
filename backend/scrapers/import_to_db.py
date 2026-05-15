"""
Import scraped schemes JSON into the Supabase database.

Usage:
    python scrapers/import_to_db.py

Reads from: scrapers/output/schemes_scraped.json
Inserts into: schemes table (skips duplicates by scheme_id)
"""

import asyncio
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv()


async def import_schemes():
    input_path = "scrapers/output/schemes_scraped.json"

    if not os.path.exists(input_path):
        print(f"❌ File not found: {input_path}")
        print("   Run: python scrapers/myscheme.py first")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    print(f"📂 Loaded {len(schemes)} schemes from {input_path}")

    conn = await asyncpg.connect(dsn=os.getenv("DATABASE_URL"), ssl="require")

    inserted = 0
    skipped = 0
    errors = 0

    for s in schemes:
        e = s.get("eligibility", {})
        try:
            await conn.execute(
                """
                INSERT INTO schemes (
                    scheme_id, name, ministry, benefit_type,
                    benefit_amount, applicable_states,
                    gender, caste_categories,
                    min_age, max_age, max_income, occupation_types,
                    documents_required, application_url,
                    is_rolling, verified_at, active
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6,
                    $7, $8,
                    $9, $10, $11, $12,
                    $13, $14,
                    $15, $16, $17
                )
                ON CONFLICT (scheme_id) DO NOTHING
                """,
                s["scheme_id"],
                s["name"],
                s.get("ministry", ""),
                s.get("benefit_type", "other"),
                s.get("benefit_amount"),
                e.get("applicable_states"),
                e.get("gender"),
                e.get("caste_categories"),
                e.get("min_age"),
                e.get("max_age"),
                e.get("max_income"),
                e.get("occupation_types"),
                s.get("documents_required"),
                s.get("application_url"),
                s.get("is_rolling", True),
                s.get("verified_at"),
                s.get("active", True),
            )
            inserted += 1
            print(f"  ✅ {s['scheme_id']}")
        except asyncpg.UniqueViolationError:
            skipped += 1
            print(f"  ⏭  Skipped (duplicate): {s['scheme_id']}")
        except Exception as ex:
            errors += 1
            print(f"  ❌ Error on {s['scheme_id']}: {ex}")

    await conn.close()

    print(f"\n── Import complete ──────────────────")
    print(f"  Inserted: {inserted}")
    print(f"  Skipped:  {skipped}")
    print(f"  Errors:   {errors}")


if __name__ == "__main__":
    asyncio.run(import_schemes())