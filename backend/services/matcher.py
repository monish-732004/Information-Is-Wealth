from models.scheme import UserProfile


def is_eligible(user: UserProfile, scheme: dict) -> bool:
    """
    Check if a user matches a scheme's eligibility criteria.
    NULL in the scheme means no restriction on that dimension.
    Returns True if the user passes ALL non-null criteria.
    """

    # State check — if scheme has states listed, user must be in one of them
    if scheme["applicable_states"] is not None:
        if user.state not in scheme["applicable_states"]:
            return False

    # Gender check
    if scheme["gender"] is not None:
        if user.gender != scheme["gender"]:
            return False

    # Caste check — user must match at least one listed caste category
    if scheme["caste_categories"] is not None:
        if user.caste_category not in scheme["caste_categories"]:
            return False

    # Age check — min and max are independent (either can be null)
    if scheme["min_age"] is not None:
        if user.age < scheme["min_age"]:
            return False

    if scheme["max_age"] is not None:
        if user.age > scheme["max_age"]:
            return False

    # Income check — user's income must be at or below max
    if scheme["max_income"] is not None:
        if user.income_annual > scheme["max_income"]:
            return False

    # Occupation check — user must match at least one listed type
    if scheme["occupation_types"] is not None:
        if user.occupation_type not in scheme["occupation_types"]:
            return False

    return True


def explain_mismatch(user: UserProfile, scheme: dict) -> list[str]:
    """
    Returns a list of reasons why the user does NOT match.
    Used for the 'why am I not eligible' feature.
    """
    reasons = []

    if scheme["applicable_states"] is not None:
        if user.state not in scheme["applicable_states"]:
            reasons.append(
                f"This scheme is only for residents of: {', '.join(scheme['applicable_states'])}"
            )

    if scheme["gender"] is not None:
        if user.gender != scheme["gender"]:
            reasons.append(f"This scheme is only for {scheme['gender']} applicants")

    if scheme["caste_categories"] is not None:
        if user.caste_category not in scheme["caste_categories"]:
            reasons.append(
                f"This scheme is only for: {', '.join(scheme['caste_categories'])} categories"
            )

    if scheme["min_age"] is not None:
        if user.age < scheme["min_age"]:
            reasons.append(f"Minimum age required is {scheme['min_age']} years")

    if scheme["max_age"] is not None:
        if user.age > scheme["max_age"]:
            reasons.append(f"Maximum age allowed is {scheme['max_age']} years")

    if scheme["max_income"] is not None:
        if user.income_annual > scheme["max_income"]:
            reasons.append(
                f"Maximum annual income allowed is ₹{scheme['max_income']:,}"
            )

    if scheme["occupation_types"] is not None:
        if user.occupation_type not in scheme["occupation_types"]:
            reasons.append(
                f"This scheme is only for: {', '.join(scheme['occupation_types'])}"
            )

    return reasons