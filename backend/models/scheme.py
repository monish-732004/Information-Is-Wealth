from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date


# ── Eligibility criteria ──────────────────────────────────────

class EligibilityCriteria(BaseModel):
    applicable_states:  Optional[List[str]] = None
    gender:             Optional[str] = None
    caste_categories:   Optional[List[str]] = None
    min_age:            Optional[int] = None
    max_age:            Optional[int] = None
    max_income:         Optional[int] = None
    occupation_types:   Optional[List[str]] = None


# ── Full scheme record ────────────────────────────────────────

class Scheme(BaseModel):
    scheme_id:            str
    name:                 str
    name_ta:              Optional[str] = None
    name_hi:              Optional[str] = None
    ministry:             str
    benefit_type:         str
    benefit_amount:       Optional[int] = None
    benefit_frequency:    Optional[str] = None
    eligibility:          EligibilityCriteria
    documents_required:   Optional[List[str]] = None
    application_url:      Optional[str] = None
    application_deadline: Optional[date] = None
    is_rolling:           bool = True
    verified_at:          Optional[date] = None
    active:               bool = True


# ── User profile (what the user tells us) ────────────────────

VALID_STATES = [
    "AN","AP","AR","AS","BR","CG","CH","DD","DL","DN","GA","GJ","HP",
    "HR","JH","JK","KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL",
    "OD","PB","PY","RJ","SK","TN","TR","TS","UK","UP","WB",
]

VALID_GENDERS = ["male", "female", "other"]
VALID_CASTES  = ["SC", "ST", "OBC", "EWS", "GEN"]
VALID_OCCUPATIONS = [
    "farmer", "student", "unorganised_worker",
    "self_employed", "unemployed", "salaried",
]


class UserProfile(BaseModel):
    state:            str
    gender:           str
    caste_category:   str
    age:              int
    income_annual:    int
    occupation_type:  str

    @field_validator("state")
    @classmethod
    def validate_state(cls, v):
        if v.upper() not in VALID_STATES:
            raise ValueError(f"Invalid state code: {v}")
        return v.upper()

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v.lower() not in VALID_GENDERS:
            raise ValueError(f"gender must be one of {VALID_GENDERS}")
        return v.lower()

    @field_validator("caste_category")
    @classmethod
    def validate_caste(cls, v):
        if v.upper() not in VALID_CASTES:
            raise ValueError(f"caste_category must be one of {VALID_CASTES}")
        return v.upper()

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if not (0 <= v <= 120):
            raise ValueError("age must be between 0 and 120")
        return v

    @field_validator("income_annual")
    @classmethod
    def validate_income(cls, v):
        if v < 0:
            raise ValueError("income_annual cannot be negative")
        return v

    @field_validator("occupation_type")
    @classmethod
    def validate_occupation(cls, v):
        if v.lower() not in VALID_OCCUPATIONS:
            raise ValueError(f"occupation_type must be one of {VALID_OCCUPATIONS}")
        return v.lower()


# ── Request / response models ─────────────────────────────────

class MatchRequest(BaseModel):
    user_profile: UserProfile
    language: Optional[str] = "en"


class MatchedScheme(BaseModel):
    scheme_id:            str
    name:                 str
    name_en:              str
    ministry:             str
    benefit_type:         str
    benefit_amount:       Optional[int] = None
    benefit_frequency:    Optional[str] = None
    application_url:      Optional[str] = None
    application_deadline: Optional[str] = None
    is_rolling:           bool = True
    documents_required:   Optional[List[str]] = None


class MatchResponse(BaseModel):
    total:      int
    schemes:    List[MatchedScheme]
    user_state: str


class EligibilityCheckResponse(BaseModel):
    scheme_id: str
    name:      str
    eligible:  bool
    reasons:   List[str]