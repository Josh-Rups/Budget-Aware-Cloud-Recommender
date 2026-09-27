from typing import Any, Dict, List, Optional

from backend.models.requirements import ApplicationRequirements
from backend.models.evaluation import ArchitectureEvaluation


# =========================================================
# HELPER
# =========================================================

def create_conflict(
    conflict_type: str,
    severity: str,
    message: str,
    evidence: Dict[str, Any],
) -> Dict[str, Any]:

    return {
        "type": conflict_type,
        "severity": severity,
        "message": message,
        "evidence": evidence,
    }


# =========================================================
# BUDGET CONFLICT
# =========================================================

def detect_budget_conflict(
    requirements: ApplicationRequirements,
    evaluations: List[ArchitectureEvaluation],
) -> Optional[Dict[str, Any]]:

    if not evaluations:
        return None

    within_budget = [
        evaluation
        for evaluation in evaluations
        if evaluation.within_budget
    ]

    # If at least one architecture meets the budget,
    # there is no budget conflict.
    if within_budget:
        return None

    cheapest = min(
        evaluations,
        key=lambda evaluation:
            evaluation.estimated_monthly_cost
    )

    return create_conflict(
        conflict_type="BUDGET_CONFLICT",

        severity="high",

        message=(
            f"No evaluated architecture meets the "
            f"${requirements.budget:.2f} monthly budget. "
            f"The lowest estimated option is "
            f"${cheapest.estimated_monthly_cost:.2f} per month."
        ),

        evidence={
            "budget":
                requirements.budget,

            "cheapest_architecture":
                cheapest.architecture_name,

            "cheapest_cost":
                cheapest.estimated_monthly_cost,
        },
    )


# =========================================================
# CONTROL VS MANAGEMENT CONFLICT
# =========================================================

def detect_control_management_conflict(
    requirements: ApplicationRequirements,
) -> Optional[Dict[str, Any]]:

    priorities = set(
        requirements.user_priorities or []
    )

    control = (
        requirements.infrastructure_control
        or ""
    ).strip().lower()

    management = (
        requirements.management_preference
        or ""
    ).strip().lower()


    # High control can come from either:
    # 1. Extracted technical preference
    # 2. Explicit user priority
    wants_high_control = (
        "infrastructure_control" in priorities
        or control == "high"
        or control == "high-control"
    )


    # Low management can also come from either:
    # 1. Extracted management preference
    # 2. Explicit user priority
    wants_low_management = (
        "low_management" in priorities
        or management == "low"
    )


    if not (
        wants_high_control
        and wants_low_management
    ):
        return None


    return create_conflict(
        conflict_type=
            "CONTROL_MANAGEMENT_CONFLICT",

        severity="medium",

        message=(
            "Maximum infrastructure control and "
            "less infrastructure management create "
            "a trade-off. More direct control usually "
            "requires more infrastructure management."
        ),

        evidence={
            "infrastructure_control":
                requirements.infrastructure_control,

            "management_preference":
                requirements.management_preference,

            "user_priorities":
                requirements.user_priorities,
        },
    )


# =========================================================
# AVAILABILITY VS BUDGET CONFLICT
# =========================================================

def detect_availability_budget_conflict(
    requirements: ApplicationRequirements,
    evaluations: List[ArchitectureEvaluation],
) -> Optional[Dict[str, Any]]:

    if not evaluations:
        return None

    priorities = set(
        requirements.user_priorities or []
    )

    availability = (
        requirements.availability
        or ""
    ).strip().lower()


    wants_high_availability = (
        availability == "high availability"
        or "availability" in priorities
    )


    if not wants_high_availability:
        return None


    # Only report this conflict when every evaluated
    # architecture exceeds the user's budget.
    all_over_budget = all(
        not evaluation.within_budget
        for evaluation in evaluations
    )


    if not all_over_budget:
        return None


    return create_conflict(
        conflict_type=
            "AVAILABILITY_BUDGET_CONFLICT",

        severity="medium",

        message=(
            "The high-availability goal is being "
            "evaluated alongside a budget that none "
            "of the current architecture options meet. "
            "Availability requirements may require "
            "additional infrastructure and cost."
        ),

        evidence={
            "budget":
                requirements.budget,

            "availability":
                requirements.availability,

            "availability_priority":
                "availability" in priorities,
        },
    )


# =========================================================
# MAIN CONFLICT ANALYSIS
# =========================================================

def detect_constraint_conflicts(
    requirements: ApplicationRequirements,
    evaluations: List[ArchitectureEvaluation],
) -> Dict[str, Any]:

    conflicts = []


    # -----------------------------------------------------
    # 1. Budget conflict
    # -----------------------------------------------------

    budget_conflict = detect_budget_conflict(
        requirements,
        evaluations,
    )

    if budget_conflict:
        conflicts.append(
            budget_conflict
        )


    # -----------------------------------------------------
    # 2. Control vs management conflict
    # -----------------------------------------------------

    control_management_conflict = (
        detect_control_management_conflict(
            requirements
        )
    )

    if control_management_conflict:
        conflicts.append(
            control_management_conflict
        )


    # -----------------------------------------------------
    # 3. Availability vs budget conflict
    # -----------------------------------------------------

    availability_budget_conflict = (
        detect_availability_budget_conflict(
            requirements,
            evaluations,
        )
    )

    if availability_budget_conflict:
        conflicts.append(
            availability_budget_conflict
        )


    return {
        "has_conflicts":
            len(conflicts) > 0,

        "conflict_count":
            len(conflicts),

        "conflicts":
            conflicts,
    }


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    from backend.services.architecture_engine import (
        generate_architectures
    )

    from backend.services.cost_engine import (
        calculate_all_costs
    )

    from backend.services.evaluation_engine import (
        evaluate_architectures
    )


    # -----------------------------------------------------
    # TEST SCENARIO
    # -----------------------------------------------------
    #
    # This intentionally uses a very low budget.
    # We expect the conflict engine to detect that
    # none of the evaluated architectures can fit it.
    # -----------------------------------------------------

    requirements = ApplicationRequirements(

        application_type=
            "business application",

        expected_users=2000,

        traffic_pattern=
            "Steady",

        database=
            "PostgreSQL",

        storage_required=True,

        availability=
            "Standard",

        workload_type=
            "containerized",

        management_preference=
            "low",

        infrastructure_control=
            "high",

        user_priorities=[
            "infrastructure_control",
            "low_management"
        ],

        region=
            "us-east-1",

        budget=500
    )


    # -----------------------------------------------------
    # 1. Generate architecture options
    # -----------------------------------------------------

    architectures = generate_architectures(
        requirements
    )


    # -----------------------------------------------------
    # 2. Calculate deterministic costs
    # -----------------------------------------------------

    costs = calculate_all_costs(
        architectures,
        requirements
    )


    # -----------------------------------------------------
    # 3. Evaluate architectures
    # -----------------------------------------------------

    evaluation_result = evaluate_architectures(
        architectures,
        costs,
        requirements
    )


    # -----------------------------------------------------
    # 4. Detect conflicts
    # -----------------------------------------------------

    conflict_result = detect_constraint_conflicts(
        requirements,
        evaluation_result.evaluations
    )


    # -----------------------------------------------------
    # PRINT RESULTS
    # -----------------------------------------------------

    print("\n==============================")
    print("CONSTRAINT CONFLICT TEST")
    print("==============================")


    print(
        "\nBudget: "
        f"${requirements.budget:.2f}"
    )


    print(
        "Conflicts detected: "
        f"{conflict_result['conflict_count']}"
    )


    if not conflict_result["has_conflicts"]:

        print(
            "\nNo constraint conflicts detected."
        )


    for conflict in conflict_result["conflicts"]:

        print("\n------------------------------")

        print(
            "Type: "
            f"{conflict['type']}"
        )

        print(
            "Severity: "
            f"{conflict['severity']}"
        )

        print(
            "Message: "
            f"{conflict['message']}"
        )

        print(
            "Evidence: "
            f"{conflict['evidence']}"
        )


    print("\n==============================")