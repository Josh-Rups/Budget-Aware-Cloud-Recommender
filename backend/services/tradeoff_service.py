from typing import List, Dict, Any

from backend.models.evaluation import (
    ArchitectureEvaluation
)


# =========================================================
# SETTINGS
# =========================================================

# Ignore extremely small score differences.
# This prevents a difference such as 0.01 from being
# presented as a meaningful trade-off.
MIN_CRITERION_DIFFERENCE = 0.5


# =========================================================
# CRITERION LOOKUP
# =========================================================

def get_criterion_scores(
    evaluation: ArchitectureEvaluation
) -> Dict[str, float]:

    """
    Convert an architecture's criterion list into a
    simple dictionary.

    Example:

    {
        "Budget fit": 8.0,
        "Workload fit": 10.0,
        "Scalability": 10.0,
        "Management fit": 7.0,
        "Requirement fit": 10.0
    }
    """

    return {
        criterion.name: criterion.score
        for criterion in evaluation.criteria
    }


# =========================================================
# COST COMPARISON
# =========================================================

def calculate_cost_difference(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, Any]:

    """
    Compare the monthly cost of an alternative with the
    recommended architecture.

    Positive savings means the alternative is cheaper.
    Negative savings means the alternative is more expensive.
    """

    recommended_cost = (
        recommended.estimated_monthly_cost
    )

    alternative_cost = (
        alternative.estimated_monthly_cost
    )

    savings = round(
        recommended_cost - alternative_cost,
        2
    )

    if recommended_cost > 0:

        percentage_difference = round(
            (
                abs(
                    alternative_cost -
                    recommended_cost
                )
                / recommended_cost
            ) * 100,
            2
        )

    else:

        percentage_difference = 0.0


    if savings > 0:

        cost_status = "cheaper"

    elif savings < 0:

        cost_status = "more_expensive"

    else:

        cost_status = "same_cost"


    return {
        "recommended_cost":
            recommended_cost,

        "alternative_cost":
            alternative_cost,

        "savings":
            savings,

        "percentage_difference":
            percentage_difference,

        "cost_status":
            cost_status
    }


# =========================================================
# CRITERION TRADE-OFFS
# =========================================================

def compare_criteria(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, List[Dict[str, Any]]]:

    """
    Compare the criterion scores of an alternative against
    the recommended architecture.

    A gain means the alternative performs better on that
    criterion.

    A loss means the alternative performs worse.
    """

    recommended_scores = (
        get_criterion_scores(
            recommended
        )
    )

    alternative_scores = (
        get_criterion_scores(
            alternative
        )
    )


    gains = []
    losses = []
    same = []


    for criterion_name, recommended_score in (
        recommended_scores.items()
    ):

        alternative_score = (
            alternative_scores.get(
                criterion_name
            )
        )


        if alternative_score is None:
            continue


        difference = round(
            alternative_score -
            recommended_score,
            2
        )


        comparison = {
            "criterion":
                criterion_name,

            "recommended_score":
                recommended_score,

            "alternative_score":
                alternative_score,

            "difference":
                difference
        }


        if (
            difference >=
            MIN_CRITERION_DIFFERENCE
        ):

            gains.append(
                comparison
            )


        elif (
            difference <=
            -MIN_CRITERION_DIFFERENCE
        ):

            losses.append(
                comparison
            )


        else:

            same.append(
                comparison
            )


    return {
        "gains": gains,
        "losses": losses,
        "similar": same
    }


# =========================================================
# BUILD ONE ALTERNATIVE ANALYSIS
# =========================================================

def build_alternative_analysis(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, Any]:

    """
    Build structured trade-off information for one
    alternative architecture.
    """

    cost_comparison = (
        calculate_cost_difference(
            recommended,
            alternative
        )
    )


    criterion_comparison = (
        compare_criteria(
            recommended,
            alternative
        )
    )


    total_score_difference = round(
        alternative.total_score -
        recommended.total_score,
        2
    )


    return {

        "architecture_id":
            alternative.architecture_id,

        "architecture_name":
            alternative.architecture_name,

        "estimated_monthly_cost":
            alternative.estimated_monthly_cost,

        "within_budget":
            alternative.within_budget,

        "total_score":
            alternative.total_score,

        "score_difference":
            total_score_difference,

        "cost_comparison":
            cost_comparison,

        "gains":
            criterion_comparison["gains"],

        "losses":
            criterion_comparison["losses"],

        "similar":
            criterion_comparison["similar"]
    }


# =========================================================
# GENERATE TRADE-OFF ANALYSIS
# =========================================================

def generate_tradeoff_analysis(
    evaluations: List[
        ArchitectureEvaluation
    ],
    recommended_architecture_id: str
) -> Dict[str, Any]:

    """
    Compare every alternative architecture with the
    deterministic recommendation.

    This function does not select or modify the
    recommendation.

    It only explains what the user would gain or lose by
    choosing another architecture.
    """


    recommended = next(

        (
            evaluation

            for evaluation
            in evaluations

            if evaluation.architecture_id
            == recommended_architecture_id
        ),

        None
    )


    if recommended is None:

        raise ValueError(
            "Recommended architecture was not found "
            "in the evaluation results."
        )


    alternatives = []


    for evaluation in evaluations:

        if (
            evaluation.architecture_id
            == recommended_architecture_id
        ):

            continue


        analysis = (
            build_alternative_analysis(
                recommended,
                evaluation
            )
        )


        alternatives.append(
            analysis
        )


    # Cheapest alternatives first.
    alternatives.sort(
        key=lambda item:
            item["estimated_monthly_cost"]
    )


    return {

        "recommended_architecture": {

            "architecture_id":
                recommended.architecture_id,

            "architecture_name":
                recommended.architecture_name,

            "estimated_monthly_cost":
                recommended.estimated_monthly_cost,

            "within_budget":
                recommended.within_budget,

            "total_score":
                recommended.total_score
        },

        "alternatives":
            alternatives
    }

    from typing import List, Dict, Any

from backend.models.evaluation import (
    ArchitectureEvaluation
)


# =========================================================
# SETTINGS
# =========================================================

# Ignore extremely small score differences.
# This prevents a difference such as 0.01 from being
# presented as a meaningful trade-off.
MIN_CRITERION_DIFFERENCE = 0.5


# =========================================================
# CRITERION LOOKUP
# =========================================================

def get_criterion_scores(
    evaluation: ArchitectureEvaluation
) -> Dict[str, float]:

    """
    Convert an architecture's criterion list into a
    simple dictionary.

    Example:

    {
        "Budget fit": 8.0,
        "Workload fit": 10.0,
        "Scalability": 10.0,
        "Management fit": 7.0,
        "Requirement fit": 10.0
    }
    """

    return {
        criterion.name: criterion.score
        for criterion in evaluation.criteria
    }


# =========================================================
# COST COMPARISON
# =========================================================

def calculate_cost_difference(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, Any]:

    """
    Compare the monthly cost of an alternative with the
    recommended architecture.

    Positive savings means the alternative is cheaper.
    Negative savings means the alternative is more expensive.
    """

    recommended_cost = (
        recommended.estimated_monthly_cost
    )

    alternative_cost = (
        alternative.estimated_monthly_cost
    )

    savings = round(
        recommended_cost - alternative_cost,
        2
    )

    if recommended_cost > 0:

        percentage_difference = round(
            (
                abs(
                    alternative_cost -
                    recommended_cost
                )
                / recommended_cost
            ) * 100,
            2
        )

    else:

        percentage_difference = 0.0


    if savings > 0:

        cost_status = "cheaper"

    elif savings < 0:

        cost_status = "more_expensive"

    else:

        cost_status = "same_cost"


    return {
        "recommended_cost":
            recommended_cost,

        "alternative_cost":
            alternative_cost,

        "savings":
            savings,

        "percentage_difference":
            percentage_difference,

        "cost_status":
            cost_status
    }


# =========================================================
# CRITERION TRADE-OFFS
# =========================================================

def compare_criteria(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, List[Dict[str, Any]]]:

    """
    Compare the criterion scores of an alternative against
    the recommended architecture.

    A gain means the alternative performs better on that
    criterion.

    A loss means the alternative performs worse.
    """

    recommended_scores = (
        get_criterion_scores(
            recommended
        )
    )

    alternative_scores = (
        get_criterion_scores(
            alternative
        )
    )


    gains = []
    losses = []
    same = []


    for criterion_name, recommended_score in (
        recommended_scores.items()
    ):

        alternative_score = (
            alternative_scores.get(
                criterion_name
            )
        )


        if alternative_score is None:
            continue


        difference = round(
            alternative_score -
            recommended_score,
            2
        )


        comparison = {
            "criterion":
                criterion_name,

            "recommended_score":
                recommended_score,

            "alternative_score":
                alternative_score,

            "difference":
                difference
        }


        if (
            difference >=
            MIN_CRITERION_DIFFERENCE
        ):

            gains.append(
                comparison
            )


        elif (
            difference <=
            -MIN_CRITERION_DIFFERENCE
        ):

            losses.append(
                comparison
            )


        else:

            same.append(
                comparison
            )


    return {
        "gains": gains,
        "losses": losses,
        "similar": same
    }


# =========================================================
# BUILD ONE ALTERNATIVE ANALYSIS
# =========================================================

def build_alternative_analysis(
    recommended: ArchitectureEvaluation,
    alternative: ArchitectureEvaluation
) -> Dict[str, Any]:

    """
    Build structured trade-off information for one
    alternative architecture.
    """

    cost_comparison = (
        calculate_cost_difference(
            recommended,
            alternative
        )
    )


    criterion_comparison = (
        compare_criteria(
            recommended,
            alternative
        )
    )


    total_score_difference = round(
        alternative.total_score -
        recommended.total_score,
        2
    )


    return {

        "architecture_id":
            alternative.architecture_id,

        "architecture_name":
            alternative.architecture_name,

        "estimated_monthly_cost":
            alternative.estimated_monthly_cost,

        "within_budget":
            alternative.within_budget,

        "total_score":
            alternative.total_score,

        "score_difference":
            total_score_difference,

        "cost_comparison":
            cost_comparison,

        "gains":
            criterion_comparison["gains"],

        "losses":
            criterion_comparison["losses"],

        "similar":
            criterion_comparison["similar"]
    }


# =========================================================
# GENERATE TRADE-OFF ANALYSIS
# =========================================================

def generate_tradeoff_analysis(
    evaluations: List[
        ArchitectureEvaluation
    ],
    recommended_architecture_id: str
) -> Dict[str, Any]:

    """
    Compare every alternative architecture with the
    deterministic recommendation.

    This function does not select or modify the
    recommendation.

    It only explains what the user would gain or lose by
    choosing another architecture.
    """


    recommended = next(

        (
            evaluation

            for evaluation
            in evaluations

            if evaluation.architecture_id
            == recommended_architecture_id
        ),

        None
    )


    if recommended is None:

        raise ValueError(
            "Recommended architecture was not found "
            "in the evaluation results."
        )


    alternatives = []


    for evaluation in evaluations:

        if (
            evaluation.architecture_id
            == recommended_architecture_id
        ):

            continue


        analysis = (
            build_alternative_analysis(
                recommended,
                evaluation
            )
        )


        alternatives.append(
            analysis
        )


    # Cheapest alternatives first.
    alternatives.sort(
        key=lambda item:
            item["estimated_monthly_cost"]
    )


    return {

        "recommended_architecture": {

            "architecture_id":
                recommended.architecture_id,

            "architecture_name":
                recommended.architecture_name,

            "estimated_monthly_cost":
                recommended.estimated_monthly_cost,

            "within_budget":
                recommended.within_budget,

            "total_score":
                recommended.total_score
        },

        "alternatives":
            alternatives
    }

# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    from backend.models.requirements import (
        ApplicationRequirements
    )

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

    requirements = ApplicationRequirements(

        application_type="business application",

        expected_users=8000,

        traffic_pattern="Steady",

        database="PostgreSQL",

        storage_required=True,

        availability="Standard",

        workload_type="containerized",

        management_preference="low",

        infrastructure_control="medium",

        user_priorities=[
            "scalability",
            "low_management"
        ],

        region="us-east-1",

        budget=500
    )


    # -----------------------------------------------------
    # GENERATE ARCHITECTURES
    # -----------------------------------------------------

    architectures = generate_architectures(
        requirements
    )


    # -----------------------------------------------------
    # CALCULATE COSTS
    # -----------------------------------------------------

    costs = calculate_all_costs(
        architectures,
        requirements
    )


    # -----------------------------------------------------
    # EVALUATE
    # -----------------------------------------------------

    evaluation_result = evaluate_architectures(
        architectures,
        costs,
        requirements
    )


    # -----------------------------------------------------
    # GENERATE TRADE-OFFS
    # -----------------------------------------------------

    tradeoffs = generate_tradeoff_analysis(

        evaluation_result.evaluations,

        evaluation_result
        .recommended_architecture_id
    )


    # -----------------------------------------------------
    # DISPLAY RESULT
    # -----------------------------------------------------

    recommended = (
        tradeoffs[
            "recommended_architecture"
        ]
    )


    print(
        "\n================================"
    )

    print(
        "TRADE-OFF ANALYSIS"
    )

    print(
        "================================"
    )


    print(
        "\nRECOMMENDED:",
        recommended[
            "architecture_name"
        ]
    )

    print(
        "COST:",
        f"${recommended['estimated_monthly_cost']:.2f}"
    )

    print(
        "SCORE:",
        recommended[
            "total_score"
        ]
    )


    for alternative in (
        tradeoffs["alternatives"]
    ):

        print(
            "\n--------------------------------"
        )

        print(
            "ALTERNATIVE:",
            alternative[
                "architecture_name"
            ]
        )

        print(
            "COST:",
            f"${alternative['estimated_monthly_cost']:.2f}"
        )

        print(
            "SCORE:",
            alternative[
                "total_score"
            ]
        )


        cost = (
            alternative[
                "cost_comparison"
            ]
        )


        if cost["cost_status"] == "cheaper":

            print(
                "COST CHANGE:",
                f"Save ${cost['savings']:.2f}/month"
            )

        elif (
            cost["cost_status"]
            == "more_expensive"
        ):

            print(
                "COST CHANGE:",
                f"Costs ${abs(cost['savings']):.2f} "
                "more/month"
            )

        else:

            print(
                "COST CHANGE: Same estimated cost"
            )


        print("\nGAINS:")

        if alternative["gains"]:

            for gain in alternative["gains"]:

                print(
                    f" + {gain['criterion']}: "
                    f"{gain['recommended_score']} "
                    f"→ {gain['alternative_score']}"
                )

        else:

            print(
                " + None"
            )


        print("\nLOSSES:")

        if alternative["losses"]:

            for loss in alternative["losses"]:

                print(
                    f" - {loss['criterion']}: "
                    f"{loss['recommended_score']} "
                    f"→ {loss['alternative_score']}"
                )

        else:

            print(
                " - None"
            )


    print(
        "\n================================"
    )