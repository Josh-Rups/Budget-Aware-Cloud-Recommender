from typing import List

from backend.models.requirements import ApplicationRequirements
from backend.models.architecture import ArchitectureOption
from backend.models.cost import ArchitectureCost
from backend.models.evaluation import (
    EvaluationCriterion,
    ArchitectureEvaluation,
    EvaluationResponse
)


# =========================================================
# SCORING WEIGHTS
# =========================================================

BUDGET_WEIGHT = 0.30
WORKLOAD_FIT_WEIGHT = 0.25
SCALABILITY_WEIGHT = 0.20
MANAGEMENT_WEIGHT = 0.15
REQUIREMENT_FIT_WEIGHT = 0.10


# =========================================================
# BUDGET SCORE
# =========================================================

def calculate_budget_score(
    cost: float,
    budget: float
):

    usage_ratio = cost / budget

    if usage_ratio <= 0.25:

        return 10.0, (
            "Estimated cost uses 25% or less "
            "of the monthly budget."
        )

    if usage_ratio <= 0.50:

        return 8.0, (
            "Estimated cost uses 50% or less "
            "of the monthly budget."
        )

    if usage_ratio <= 0.75:

        return 6.0, (
            "Estimated cost uses 75% or less "
            "of the monthly budget."
        )

    if usage_ratio <= 1.0:

        return 4.0, (
            "Estimated cost is within budget, "
            "but leaves limited remaining budget."
        )

    if usage_ratio <= 1.10:

        return 3.0, (
            "Estimated cost is slightly over "
            "the monthly budget."
        )

    if usage_ratio <= 1.25:

        return 2.0, (
            "Estimated cost exceeds the monthly "
            "budget by up to 25%."
        )

    if usage_ratio <= 1.50:

        return 1.0, (
            "Estimated cost significantly exceeds "
            "the monthly budget."
        )

    return 0.0, (
        "Estimated cost is far above "
        "the monthly budget."
    )


# =========================================================
# WORKLOAD FIT SCORE
# =========================================================

def calculate_workload_fit_score(
    architecture: ArchitectureOption,
    requirements: ApplicationRequirements
):

    """
    Evaluate only the technical workload model.

    Management preference and infrastructure control
    are evaluated separately in the management-fit
    criterion.
    """

    architecture_id = architecture.id

    workload = (
        requirements.workload_type or ""
    ).lower().strip()


    # -----------------------------------------------------
    # EVENT-DRIVEN
    # -----------------------------------------------------

    if workload == "event-driven":

        if architecture_id == "serverless":

            return 10.0, (
                "Serverless closely matches the "
                "event-driven workload."
            )

        if architecture_id == "containers":

            return 6.0, (
                "Containers can support an event-driven "
                "application, but they are not the "
                "closest match."
            )

        return 4.0, (
            "EC2 can support the workload, but requires "
            "more continuously managed infrastructure "
            "for an event-driven pattern."
        )


    # -----------------------------------------------------
    # CONTAINERIZED
    # -----------------------------------------------------

    if workload == "containerized":

        if architecture_id == "containers":

            return 10.0, (
                "The container architecture directly "
                "matches the containerized workload."
            )

        if architecture_id == "virtual-machines":

            return 6.0, (
                "EC2 can run containers, but requires "
                "more infrastructure management than "
                "the managed container option."
            )

        return 3.0, (
            "Serverless does not directly match the "
            "requested container execution model."
        )


    # -----------------------------------------------------
    # TRADITIONAL SERVER
    # -----------------------------------------------------

    if workload == "traditional-server":

        if architecture_id == "virtual-machines":

            return 10.0, (
                "EC2 directly matches the traditional "
                "server workload."
            )

        if architecture_id == "containers":

            return 6.0, (
                "Containers can run the application, "
                "but do not directly match the requested "
                "traditional server model."
            )

        return 2.0, (
            "Serverless does not closely match the "
            "traditional server workload."
        )


    # -----------------------------------------------------
    # GENERAL APPLICATION
    # -----------------------------------------------------

    if workload == "general":

        return 7.0, (
            "No specialized workload model was requested, "
            "so this architecture remains a viable "
            "general-purpose option."
        )


    # -----------------------------------------------------
    # UNKNOWN WORKLOAD
    # -----------------------------------------------------

    return 5.0, (
        "The workload type is unknown, so no architecture "
        "receives a specialized workload advantage."
    )


# =========================================================
# SCALABILITY SCORE
# =========================================================

def calculate_scalability_score(
    architecture: ArchitectureOption,
    requirements: ApplicationRequirements
):

    scalability = (
        architecture.scalability
        .lower()
        .strip()
    )

    if scalability == "high":

        score = 10.0

    elif scalability == "medium":

        score = 7.0

    else:

        score = 4.0


    traffic = (
        requirements.traffic_pattern or ""
    ).lower().strip()


    if (
        traffic in [
            "bursty",
            "seasonal"
        ]
        and scalability != "high"
    ):

        score -= 2


    score = max(
        0,
        min(score, 10)
    )


    if traffic in [
        "bursty",
        "seasonal"
    ]:

        if scalability == "high":

            reason = (
                f"Architecture scalability is "
                f"{architecture.scalability}, which is "
                f"well suited to {traffic} traffic."
            )

        else:

            reason = (
                f"Architecture scalability is "
                f"{architecture.scalability}. "
                f"The {traffic} traffic pattern reduces "
                f"its scalability fit."
            )

    else:

        reason = (
            f"Architecture scalability is "
            f"{architecture.scalability}."
        )


    return score, reason


# =========================================================
# MANAGEMENT + INFRASTRUCTURE CONTROL SCORE
# =========================================================

def calculate_management_score(
    architecture: ArchitectureOption,
    requirements: ApplicationRequirements
):

    """
    Evaluate how well the architecture matches:

    1. Management preference
    2. Infrastructure control preference

    These factors are handled here instead of being
    included in workload fit.
    """

    architecture_id = architecture.id


    management = (
        requirements.management_preference or ""
    ).lower().strip()


    control = (
        requirements.infrastructure_control or ""
    ).lower().strip()


    component_scores = []
    reasons = []


    # =====================================================
    # MANAGEMENT PREFERENCE
    # =====================================================

    if management == "low":

        if architecture_id == "serverless":

            component_scores.append(
                10.0
            )

            reasons.append(
                "Serverless closely matches the preference "
                "for minimal infrastructure management."
            )

        elif architecture_id == "containers":

            component_scores.append(
                7.0
            )

            reasons.append(
                "Managed containers require some "
                "infrastructure management."
            )

        else:

            component_scores.append(
                4.0
            )

            reasons.append(
                "EC2 requires more direct infrastructure "
                "management than requested."
            )


    elif management == "medium":

        if architecture_id == "containers":

            component_scores.append(
                10.0
            )

            reasons.append(
                "Containers closely match the preference "
                "for some infrastructure management."
            )

        elif architecture_id == "serverless":

            component_scores.append(
                7.0
            )

            reasons.append(
                "Serverless requires less direct "
                "infrastructure management than the "
                "user is willing to handle."
            )

        else:

            component_scores.append(
                7.0
            )

            reasons.append(
                "EC2 provides management control but "
                "requires more direct responsibility."
            )


    elif management == "high-control":

        if architecture_id == "virtual-machines":

            component_scores.append(
                10.0
            )

            reasons.append(
                "EC2 closely matches the preference "
                "for direct infrastructure management."
            )

        elif architecture_id == "containers":

            component_scores.append(
                7.0
            )

            reasons.append(
                "Containers provide some infrastructure "
                "management and control."
            )

        else:

            component_scores.append(
                4.0
            )

            reasons.append(
                "Serverless provides limited direct "
                "infrastructure management."
            )


    # =====================================================
    # INFRASTRUCTURE CONTROL
    # =====================================================

    if control == "low":

        if architecture_id == "serverless":

            component_scores.append(
                10.0
            )

            reasons.append(
                "Serverless fits the preference for "
                "little direct infrastructure control."
            )

        elif architecture_id == "containers":

            component_scores.append(
                7.0
            )

            reasons.append(
                "Containers provide some infrastructure "
                "control while keeping much of the "
                "platform managed."
            )

        else:

            component_scores.append(
                4.0
            )

            reasons.append(
                "EC2 provides more infrastructure control "
                "than requested."
            )


    elif control == "medium":

        if architecture_id == "containers":

            component_scores.append(
                10.0
            )

            reasons.append(
                "Containers provide a balanced level "
                "of infrastructure control."
            )

        elif architecture_id == "virtual-machines":

            component_scores.append(
                7.0
            )

            reasons.append(
                "EC2 provides more direct infrastructure "
                "control than a medium preference requires."
            )

        else:

            component_scores.append(
                5.0
            )

            reasons.append(
                "Serverless provides less direct "
                "infrastructure control than requested."
            )


    elif control == "high":

        if architecture_id == "virtual-machines":

            component_scores.append(
                10.0
            )

            reasons.append(
                "EC2 provides direct server and operating "
                "system control."
            )

        elif architecture_id == "containers":

            component_scores.append(
                6.0
            )

            reasons.append(
                "Containers provide some infrastructure "
                "control but not full instance-level "
                "control."
            )

        else:

            component_scores.append(
                2.0
            )

            reasons.append(
                "Serverless does not provide the requested "
                "server and operating-system control."
            )


    # =====================================================
    # NO PREFERENCES PROVIDED
    # =====================================================

    if not component_scores:

        effort = (
            architecture.management_effort
            .lower()
            .strip()
        )


        if effort == "low":

            return 7.0, (
                "No management or infrastructure control "
                "preference was provided. This architecture "
                "requires relatively low infrastructure "
                "management."
            )

        if effort == "medium":

            return 7.0, (
                "No management or infrastructure control "
                "preference was provided. This architecture "
                "requires a moderate level of management."
            )

        return 7.0, (
            "No management or infrastructure control "
            "preference was provided, so no architecture "
            "receives a management preference advantage."
        )


    # =====================================================
    # CALCULATE AVERAGE MANAGEMENT FIT
    # =====================================================

    score = sum(
        component_scores
    ) / len(
        component_scores
    )


    score = round(
        score,
        2
    )


    score = max(
        0,
        min(score, 10)
    )


    return score, " ".join(
        reasons
    )


# =========================================================
# REQUIREMENT FIT SCORE
# =========================================================

def calculate_requirement_fit_score(
    architecture: ArchitectureOption,
    requirements: ApplicationRequirements
):

    score = 10.0

    reasons = []


    service_names = [

        service.name.lower()

        for service
        in architecture.services
    ]


    # =====================================================
    # DATABASE
    # =====================================================

    database = (
        requirements.database or ""
    ).lower().strip()


    if (
        database
        and database not in [
            "none",
            "unknown",
            "not sure",
            "unspecified",
            "no database"
        ]
    ):

        has_database = any(

            "rds" in service

            or "aurora" in service

            or "dynamodb" in service

            for service
            in service_names
        )


        if has_database:

            reasons.append(
                "Supports the requested database."
            )

        else:

            score -= 3

            reasons.append(
                "Requested database is not represented "
                "in this architecture."
            )


    # =====================================================
    # FILE STORAGE
    # =====================================================

    if requirements.storage_required is True:

        has_s3 = any(

            "s3" in service

            for service
            in service_names
        )


        if has_s3:

            reasons.append(
                "Supports the requested file storage."
            )

        else:

            score -= 3

            reasons.append(
                "Requested file storage is missing."
            )


    # =====================================================
    # HIGH AVAILABILITY
    # =====================================================

    availability = (
        requirements.availability or ""
    ).lower().strip()


    if availability == "high availability":

        if architecture.id in [
            "serverless",
            "containers"
        ]:

            reasons.append(
                "Architecture is well suited to "
                "high-availability deployment."
            )

        elif (
            architecture.id ==
            "virtual-machines"
        ):

            score -= 2

            reasons.append(
                "High availability requires additional "
                "EC2 infrastructure and management."
            )


    # =====================================================
    # FINAL REQUIREMENT SCORE
    # =====================================================

    score = max(
        0,
        min(score, 10)
    )


    if not reasons:

        reasons.append(
            "Architecture satisfies the known "
            "application requirements."
        )


    return score, " ".join(
        reasons
    )


# =========================================================
# EVALUATE ONE ARCHITECTURE
# =========================================================

def evaluate_architecture(
    architecture: ArchitectureOption,
    architecture_cost: ArchitectureCost,
    requirements: ApplicationRequirements
) -> ArchitectureEvaluation:


    # -----------------------------------------------------
    # BUDGET
    # -----------------------------------------------------

    budget_score, budget_reason = (
        calculate_budget_score(
            architecture_cost.total_monthly_cost,
            requirements.budget
        )
    )


    # -----------------------------------------------------
    # WORKLOAD
    # -----------------------------------------------------

    workload_score, workload_reason = (
        calculate_workload_fit_score(
            architecture,
            requirements
        )
    )


    # -----------------------------------------------------
    # SCALABILITY
    # -----------------------------------------------------

    scalability_score, scalability_reason = (
        calculate_scalability_score(
            architecture,
            requirements
        )
    )


    # -----------------------------------------------------
    # MANAGEMENT + CONTROL
    # -----------------------------------------------------

    management_score, management_reason = (
        calculate_management_score(
            architecture,
            requirements
        )
    )


    # -----------------------------------------------------
    # REQUIREMENTS
    # -----------------------------------------------------

    requirement_score, requirement_reason = (
        calculate_requirement_fit_score(
            architecture,
            requirements
        )
    )


    # =====================================================
    # WEIGHTED TOTAL
    # =====================================================

    total_score = (

        budget_score *
        BUDGET_WEIGHT

        +

        workload_score *
        WORKLOAD_FIT_WEIGHT

        +

        scalability_score *
        SCALABILITY_WEIGHT

        +

        management_score *
        MANAGEMENT_WEIGHT

        +

        requirement_score *
        REQUIREMENT_FIT_WEIGHT
    )


    total_score = round(
        total_score,
        2
    )


    # =====================================================
    # CRITERIA
    # =====================================================

    criteria = [

        EvaluationCriterion(
            name="Budget fit",
            score=budget_score,
            weight=BUDGET_WEIGHT,
            reason=budget_reason
        ),

        EvaluationCriterion(
            name="Workload fit",
            score=workload_score,
            weight=WORKLOAD_FIT_WEIGHT,
            reason=workload_reason
        ),

        EvaluationCriterion(
            name="Scalability",
            score=scalability_score,
            weight=SCALABILITY_WEIGHT,
            reason=scalability_reason
        ),

        EvaluationCriterion(
            name="Management effort",
            score=management_score,
            weight=MANAGEMENT_WEIGHT,
            reason=management_reason
        ),

        EvaluationCriterion(
            name="Requirement fit",
            score=requirement_score,
            weight=REQUIREMENT_FIT_WEIGHT,
            reason=requirement_reason
        )
    ]


    return ArchitectureEvaluation(

        architecture_id=
            architecture.id,

        architecture_name=
            architecture.name,

        criteria=
            criteria,

        total_score=
            total_score,

        estimated_monthly_cost=
            architecture_cost.total_monthly_cost,

        within_budget=
            architecture_cost.within_budget
    )


# =========================================================
# SELECT RECOMMENDED ARCHITECTURE
# =========================================================

def select_recommended_architecture(
    evaluations: List[
        ArchitectureEvaluation
    ],
    budget: float
) -> ArchitectureEvaluation:

    """
    Select the final recommended architecture.

    Decision rules:

    1. If one or more architectures are within budget,
       compare only the architectures that are within budget.

    2. Select the architecture with the highest weighted
       evaluation score.

    3. If two architectures have the same score,
       prefer the lower-cost architecture.

    4. If every architecture is over budget, select the
       architecture with the highest overall weighted score.

       This prevents the system from recommending a poor
       technical fit simply because it is the cheapest
       over-budget option.

    5. If two over-budget architectures have the same
       weighted score, prefer the architecture with the
       smaller budget overrun.
    """


    # =====================================================
    # FIND OPTIONS WITHIN BUDGET
    # =====================================================

    within_budget = [

        evaluation

        for evaluation
        in evaluations

        if evaluation.within_budget
    ]


    # =====================================================
    # AT LEAST ONE OPTION IS WITHIN BUDGET
    # =====================================================

    if within_budget:

        return max(

            within_budget,

            key=lambda item: (

                item.total_score,

                -item.estimated_monthly_cost
            )
        )


    # =====================================================
    # ALL OPTIONS ARE OVER BUDGET
    # =====================================================
    #
    # The overall score already includes budget fit.
    #
    # Therefore, technical suitability remains part of
    # the recommendation even when no option can meet
    # the requested budget.
    #
    # Budget overrun is used only as a tie-breaker.
    # =====================================================

    return max(

        evaluations,

        key=lambda item: (

            item.total_score,

            -(
                item.estimated_monthly_cost
                - budget
            )
        )
    )


# =========================================================
# EVALUATE ALL ARCHITECTURES
# =========================================================

def evaluate_architectures(
    architectures: List[
        ArchitectureOption
    ],
    costs: List[
        ArchitectureCost
    ],
    requirements: ApplicationRequirements
) -> EvaluationResponse:


    evaluations = []


    for architecture in architectures:

        architecture_cost = next(

            (

                cost

                for cost
                in costs

                if cost.architecture_id
                == architecture.id
            ),

            None
        )


        if architecture_cost is None:

            continue


        evaluation = (
            evaluate_architecture(

                architecture,

                architecture_cost,

                requirements
            )
        )


        evaluations.append(
            evaluation
        )


    if not evaluations:

        raise ValueError(
            "No architectures could be evaluated."
        )


    recommended = (
        select_recommended_architecture(

            evaluations,

            requirements.budget
        )
    )


    return EvaluationResponse(

        evaluations=
            evaluations,

        recommended_architecture_id=
            recommended.architecture_id
    )


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


    # =====================================================
    # LOW-BUDGET TRADITIONAL SERVER TEST
    # =====================================================

    test_requirements = (
        ApplicationRequirements(

            application_type=
                "web application",

            expected_users=
                8000,

            traffic_pattern=
                "Steady",

            database=
                "PostgreSQL",

            storage_required=
                True,

            availability=
                "Standard",

            workload_type=
                "traditional-server",

            management_preference=
                "high-control",

            infrastructure_control=
                "high",

            region=
                "us-east-1",

            # Intentionally low budget.
            budget=
                50
        )
    )


    architectures = (
        generate_architectures(
            test_requirements
        )
    )


    costs = (
        calculate_all_costs(
            architectures,
            test_requirements
        )
    )


    result = (
        evaluate_architectures(
            architectures,
            costs,
            test_requirements
        )
    )


    print(
        "\n================================"
    )

    print(
        "LOW-BUDGET EVALUATION TEST"
    )

    print(
        "================================"
    )


    print(
        f"Budget: "
        f"${test_requirements.budget:.2f}"
    )


    for evaluation in result.evaluations:

        print(
            "\n--------------------------------"
        )

        print(
            evaluation
            .architecture_name
            .upper()
        )

        print(
            "--------------------------------"
        )


        print(
            f"Estimated cost: "
            f"${evaluation.estimated_monthly_cost:.2f}"
        )


        print(
            f"Within budget: "
            f"{evaluation.within_budget}"
        )


        print(
            "\nScores:"
        )


        for criterion in evaluation.criteria:

            print(
                f"  {criterion.name}: "
                f"{criterion.score}/10 "
                f"(weight {criterion.weight})"
            )


            print(
                f"    {criterion.reason}"
            )


        print(
            f"\nTOTAL SCORE: "
            f"{evaluation.total_score}/10"
        )


    print(
        "\n================================"
    )


    print(
        "RECOMMENDED ARCHITECTURE:",
        result
        .recommended_architecture_id
        .upper()
    )


    print(
        "================================"
    )