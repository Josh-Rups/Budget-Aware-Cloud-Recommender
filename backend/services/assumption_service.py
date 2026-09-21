from typing import List

from backend.models.requirements import ApplicationRequirements


# =========================================================
# ASSUMPTION SETTINGS
# =========================================================

DEFAULT_EXPECTED_USERS = 1000


# =========================================================
# GENERATE ASSUMPTIONS
# =========================================================

def generate_assumptions(
    requirements: ApplicationRequirements
) -> List[str]:

    """
    Identify assumptions that the system uses when
    requirements are missing or uncertain.

    This keeps the recommendation transparent and prevents
    hidden defaults from being presented as user requirements.
    """

    assumptions: List[str] = []


    # -----------------------------------------------------
    # EXPECTED USERS
    # -----------------------------------------------------

    if requirements.expected_users is None:

        assumptions.append(
            f"Expected users were not provided, so "
            f"{DEFAULT_EXPECTED_USERS:,} users are used "
            f"for cost estimation."
        )


    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    database = (
        requirements.database.lower().strip()
        if requirements.database
        else None
    )

    if database in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "The database type is unknown, so no database "
            "service is automatically added to the architecture."
        )


    # -----------------------------------------------------
    # TRAFFIC PATTERN
    # -----------------------------------------------------

    traffic = (
        requirements.traffic_pattern.lower().strip()
        if requirements.traffic_pattern
        else None
    )

    if traffic in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "The traffic pattern is unknown, so no additional "
            "traffic multiplier is applied to the cost estimate."
        )


    # -----------------------------------------------------
    # STORAGE
    # -----------------------------------------------------

    if requirements.storage_required is None:

        assumptions.append(
            "Storage requirements are unknown, so file storage "
            "is not automatically added to the architecture."
        )


    # -----------------------------------------------------
    # AVAILABILITY
    # -----------------------------------------------------

    availability = (
        requirements.availability.lower().strip()
        if requirements.availability
        else None
    )

    if availability in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "Availability requirements are unknown, so standard "
            "availability is used for cost estimation."
        )


    # -----------------------------------------------------
    # WORKLOAD TYPE
    # -----------------------------------------------------

    workload = (
        requirements.workload_type.lower().strip()
        if requirements.workload_type
        else None
    )

    if workload in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "The workload type is unknown, so no architecture "
            "receives a specialized workload preference."
        )


    # -----------------------------------------------------
    # MANAGEMENT PREFERENCE
    # -----------------------------------------------------

    management = (
        requirements.management_preference.lower().strip()
        if requirements.management_preference
        else None
    )

    if management in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "The management preference is unknown, so it does "
            "not influence architecture selection."
        )


    # -----------------------------------------------------
    # INFRASTRUCTURE CONTROL
    # -----------------------------------------------------

    control = (
        requirements.infrastructure_control.lower().strip()
        if requirements.infrastructure_control
        else None
    )

    if control in [
        None,
        "",
        "unknown",
        "not sure",
        "unspecified"
    ]:

        assumptions.append(
            "The infrastructure control preference is unknown, "
            "so it does not influence architecture selection."
        )


    return assumptions


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    test_requirements = ApplicationRequirements(
        application_type="web application",

        expected_users=None,

        traffic_pattern=None,

        database="Unknown",

        storage_required=None,

        availability=None,

        workload_type=None,

        management_preference=None,

        infrastructure_control=None,

        region="us-east-1",

        budget=500
    )


    assumptions = generate_assumptions(
        test_requirements
    )


    print("\nASSUMPTIONS USED:\n")


    if not assumptions:

        print(
            "No assumptions were required."
        )

    else:

        for number, assumption in enumerate(
            assumptions,
            start=1
        ):

            print(
                f"{number}. {assumption}"
            )