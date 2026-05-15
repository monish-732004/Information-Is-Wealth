"""
Scraper for https://www.myscheme.gov.in
Fetches scheme listings and formats them into our schema.

Usage:
    python scrapers/myscheme.py

Output:
    scrapers/output/schemes_scraped.json
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import os
from datetime import datetime

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; WelfareAppBot/1.0; "
        "+https://github.com/yourname/welfare-app)"
    )
}

BASE_URL = "https://www.myscheme.gov.in"
OUTPUT_DIR = "scrapers/output"


def fetch_page(url: str, retries: int = 3) -> BeautifulSoup | None:
    """Fetch a URL and return a BeautifulSoup object. Retries on failure."""
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as e:
            print(f"  Attempt {attempt + 1} failed for {url}: {e}")
            time.sleep(2 ** attempt)   # exponential backoff
    return None


def scrape_scheme_list(category_url: str) -> list[dict]:
    """
    Scrape the scheme listing page.
    Returns a list of {name, url, ministry} dicts.
    """
    soup = fetch_page(category_url)
    if not soup:
        return []

    schemes = []
    # myscheme.gov.in uses cards with class 'scheme-card' or similar
    # Adjust selectors if the site structure changes
    cards = soup.select(".scheme-card, .schemeCard, [data-scheme]")

    for card in cards:
        try:
            name_el = card.select_one("h3, h2, .scheme-name, .schemeName")
            link_el = card.select_one("a[href]")
            ministry_el = card.select_one(".ministry, .dept, .department")

            if not name_el or not link_el:
                continue

            href = link_el.get("href", "")
            if not href.startswith("http"):
                href = BASE_URL + href

            schemes.append({
                "name": name_el.get_text(strip=True),
                "url": href,
                "ministry": ministry_el.get_text(strip=True) if ministry_el else "",
            })
        except Exception as e:
            print(f"  Error parsing card: {e}")
            continue

    return schemes


def scrape_scheme_detail(scheme_url: str) -> dict:
    """
    Scrape the detail page of a single scheme.
    Extracts eligibility criteria and benefit info.
    """
    soup = fetch_page(scheme_url)
    if not soup:
        return {}

    detail = {}

    # Benefit type — look for keywords in headings / tags
    benefit_keywords = {
        "cash_transfer":  ["cash", "dbt", "financial assistance", "stipend"],
        "scholarship":    ["scholarship", "fellowship", "education"],
        "housing":        ["house", "housing", "awas"],
        "subsidy":        ["subsidy", "loan", "credit"],
        "insurance":      ["insurance", "pension", "maan-dhan"],
        "food_subsidy":   ["food", "ration", "nutrition"],
        "healthcare":     ["health", "medical", "treatment"],
        "employment":     ["employment", "job", "rozgar"],
    }
    page_text = soup.get_text().lower()
    benefit_type = "other"
    for btype, keywords in benefit_keywords.items():
        if any(kw in page_text for kw in keywords):
            benefit_type = btype
            break
    detail["benefit_type"] = benefit_type

    # Try to extract benefit amount
    import re
    amount_match = re.search(r"₹\s*([\d,]+)|rs\.?\s*([\d,]+)", page_text)
    if amount_match:
        raw = amount_match.group(1) or amount_match.group(2)
        detail["benefit_amount"] = int(raw.replace(",", ""))

    # Eligibility section
    eligibility_section = soup.find(
        lambda tag: tag.name in ["section", "div", "article"]
        and "eligib" in (tag.get_text() or "").lower()
    )

    if eligibility_section:
        text = eligibility_section.get_text(" ", strip=True).lower()

        # Gender
        if "women" in text or "female" in text:
            detail["gender"] = "female"
        elif "men only" in text or "male only" in text:
            detail["gender"] = "male"

        # Caste categories
        caste_cats = []
        for cat in ["sc", "st", "obc", "ews", "general"]:
            if cat in text:
                caste_cats.append(cat.upper().replace("GENERAL", "GEN"))
        if caste_cats:
            detail["caste_categories"] = caste_cats

        # Age range
        age_match = re.search(r"(\d+)\s*(?:to|-)\s*(\d+)\s*years", text)
        if age_match:
            detail["min_age"] = int(age_match.group(1))
            detail["max_age"] = int(age_match.group(2))

        # Income
        income_match = re.search(
            r"(?:income|annual|family).{0,30}₹\s*([\d,]+)|₹\s*([\d,]+).{0,30}(?:income|annual|family)",
            text,
        )
        if income_match:
            raw = income_match.group(1) or income_match.group(2)
            detail["max_income"] = int(raw.replace(",", ""))

        # Occupation
        occ_map = {
            "farmer":             ["farmer", "agriculture", "kisan"],
            "student":            ["student", "scholar"],
            "unorganised_worker": ["unorganised", "informal", "labour"],
            "self_employed":      ["self-employed", "entrepreneur", "artisan"],
            "unemployed":         ["unemployed", "job seeker"],
            "salaried":           ["salaried", "employee", "government servant"],
        }
        detected_occ = []
        for occ, keywords in occ_map.items():
            if any(kw in text for kw in keywords):
                detected_occ.append(occ)
        if detected_occ:
            detail["occupation_types"] = detected_occ

    # Documents required
    docs_section = soup.find(
        lambda tag: tag.name in ["section", "div", "ul"]
        and "document" in (tag.get_text() or "").lower()
    )
    if docs_section:
        doc_items = docs_section.select("li")
        detail["documents_required"] = [
            li.get_text(strip=True) for li in doc_items if li.get_text(strip=True)
        ][:8]  # cap at 8 items

    return detail


def build_scheme_id(name: str) -> str:
    """Convert scheme name to a clean ID slug."""
    import re
    slug = re.sub(r"[^a-zA-Z0-9\s]", "", name)
    slug = "_".join(slug.upper().split()[:5])
    return slug + "_SCRAPED"


def run_scraper(max_schemes: int = 50):
    """
    Main scraper entry point.
    Scrapes up to max_schemes and saves to JSON.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # myscheme.gov.in category pages
    category_urls = [
        f"{BASE_URL}/schemes",
        f"{BASE_URL}/schemes?category=women",
        f"{BASE_URL}/schemes?category=farmer",
        f"{BASE_URL}/schemes?category=student",
    ]

    all_schemes = []
    seen_names = set()

    for cat_url in category_urls:
        print(f"\nScraping listing: {cat_url}")
        listings = scrape_scheme_list(cat_url)
        print(f"  Found {len(listings)} schemes")

        for listing in listings:
            if listing["name"] in seen_names:
                continue
            if len(all_schemes) >= max_schemes:
                break

            seen_names.add(listing["name"])
            print(f"  Scraping: {listing['name']}")

            detail = scrape_scheme_detail(listing["url"])
            time.sleep(1)  # be polite — 1 second between requests

            scheme = {
                "scheme_id":         build_scheme_id(listing["name"]),
                "name":              listing["name"],
                "ministry":          listing.get("ministry", ""),
                "benefit_type":      detail.get("benefit_type", "other"),
                "benefit_amount":    detail.get("benefit_amount"),
                "eligibility": {
                    "applicable_states":  None,
                    "gender":             detail.get("gender"),
                    "caste_categories":   detail.get("caste_categories"),
                    "min_age":            detail.get("min_age"),
                    "max_age":            detail.get("max_age"),
                    "max_income":         detail.get("max_income"),
                    "occupation_types":   detail.get("occupation_types"),
                },
                "documents_required": detail.get("documents_required", []),
                "application_url":    listing["url"],
                "is_rolling":         True,
                "verified_at":        datetime.today().strftime("%Y-%m-%d"),
                "active":             True,
                "_needs_review":      True,  # flag for editorial review
            }
            all_schemes.append(scheme)

        if len(all_schemes) >= max_schemes:
            break

    # Save output
    output_path = os.path.join(OUTPUT_DIR, "schemes_scraped.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Scraped {len(all_schemes)} schemes → {output_path}")
    print("⚠️  Review schemes_scraped.json before importing to database.")
    return all_schemes


if __name__ == "__main__":
    run_scraper(max_schemes=50)