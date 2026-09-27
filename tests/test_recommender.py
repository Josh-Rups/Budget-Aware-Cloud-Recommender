from backend.models.requirements import ApplicationRequirements
from backend.services.architecture_engine import generate_architectures
from backend.services.cost_engine import calculate_all_costs
from backend.services.evaluation_engine import evaluate_architectures

from backend.services.tradeoff_service import generate_tradeoff_analysis
from backend.services.conflict_service import detect_constraint_conflicts


def run_pipeline(requirements):
    """
    Run the deterministic recommendation pipeline.
    """
    architectures = generate_architectures(requirements)

    costs = calculate_all_costs(
        architectures,
        requirements
    )

    evaluation = evaluate_architectures(
        architectures,
        costs,
        requirements
    )

    return architectures, costs, evaluation


# ============================================================
# TEST 1
# Event-driven application should prefer Serverless
# ============================================================

def test_event_driven_application_recommends_serverless():

    requirements = ApplicationRequirements(
        application_type="Web application",
        expected_users=5000,
        traffic_pattern="Bursty",
        database="none",
        storage_required=True,
        availability="Standard",
        workload_type="event-driven",
        management_preference="low",
        infrastructure_control="low",
        user_priorities=["cost", "scalability"],
        budget=200
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert len(architectures) == 3

    assert evaluation.recommended_architecture_id == "serverless"

    recommended_cost = next(
        cost
        for cost in costs
        if cost.architecture_id == "serverless"
    )

    assert recommended_cost.within_budget is True


# ============================================================
# TEST 2
# Containerized workload should prefer Containers
# ============================================================

def test_containerized_application_recommends_containers():

    requirements = ApplicationRequirements(
        application_type="Web application",
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
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert evaluation.recommended_architecture_id == "containers"

    recommended_cost = next(
        cost
        for cost in costs
        if cost.architecture_id == "containers"
    )

    assert recommended_cost.within_budget is True


# ============================================================
# TEST 3
# Traditional server workload with high control should prefer EC2
# ============================================================

def test_high_control_traditional_server_recommends_ec2():

    requirements = ApplicationRequirements(
        application_type="Business application",
        expected_users=8000,
        traffic_pattern="Steady",
        database="MySQL",
        storage_required=True,
        availability="Standard",
        workload_type="traditional-server",
        management_preference="high-control",
        infrastructure_control="high",
        user_priorities=[
            "infrastructure_control",
            "availability"
        ],
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert (
        evaluation.recommended_architecture_id
        == "virtual-machines"
    )

    recommended_cost = next(
        cost
        for cost in costs
        if cost.architecture_id == "virtual-machines"
    )

    assert recommended_cost.within_budget is True


# ============================================================
# TEST 4
# System should still recommend an architecture when all
# architectures exceed the budget
# ============================================================

def test_recommendation_when_all_options_are_over_budget():

    requirements = ApplicationRequirements(
        application_type="Business application",
        expected_users=8000,
        traffic_pattern="Steady",
        database="PostgreSQL",
        storage_required=True,
        availability="Standard",
        workload_type="traditional-server",
        management_preference="high-control",
        infrastructure_control="high",
        user_priorities=[
            "infrastructure_control",
            "cost"
        ],
        budget=50
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert all(
        cost.within_budget is False
        for cost in costs
    )

    assert (
        evaluation.recommended_architecture_id
        == "virtual-machines"
    )


# ============================================================
# TEST 5
# Technical requirements can outweigh conflicting priorities
# ============================================================

def test_technical_requirements_can_outweigh_user_priorities():

    requirements = ApplicationRequirements(
        application_type="Inventory application",
        expected_users=10000,
        traffic_pattern="Steady",
        database="PostgreSQL",
        storage_required=True,
        availability="Standard",
        workload_type="traditional-server",
        management_preference="high-control",
        infrastructure_control="high",
        user_priorities=[
            "low_management",
            "scalability"
        ],
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert (
        evaluation.recommended_architecture_id
        == "virtual-machines"
    )


# ============================================================
# TEST 6
# Unknown information should not prevent recommendation
# ============================================================

def test_unknown_requirements_with_balanced_priority():

    requirements = ApplicationRequirements(
        application_type="Web application",
        expected_users=3000,
        traffic_pattern=None,
        database="not sure",
        storage_required=None,
        availability=None,
        workload_type="general",
        management_preference=None,
        infrastructure_control=None,
        user_priorities=["balanced"],
        budget=250
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    assert len(architectures) == 3

    assert evaluation.recommended_architecture_id == "serverless"

    serverless = next(
        architecture
        for architecture in architectures
        if architecture.id == "serverless"
    )

    service_names = [
        service.name.lower()
        for service in serverless.services
    ]

    # Unknown database should not cause the system
    # to invent a database service.
    assert not any(
        "rds" in name or
        "aurora" in name or
        "dynamodb" in name
        for name in service_names
    )

# ============================================================
# TEST 7
# Trade-off analysis should return only alternative architectures
# ============================================================

def test_tradeoff_analysis_returns_alternatives():

    requirements = ApplicationRequirements(
        application_type="Web application",
        expected_users=5000,
        traffic_pattern="Bursty",
        database="none",
        storage_required=True,
        availability="Standard",
        workload_type="event-driven",
        management_preference="low",
        infrastructure_control="low",
        user_priorities=["cost", "scalability"],
        budget=200
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    tradeoffs = generate_tradeoff_analysis(
        evaluation.evaluations,
        evaluation.recommended_architecture_id
    )

    assert tradeoffs["recommended_architecture"][
        "architecture_id"
    ] == "serverless"

    assert len(tradeoffs["alternatives"]) == 2

    alternative_ids = [
        alternative["architecture_id"]
        for alternative in tradeoffs["alternatives"]
    ]

    assert "serverless" not in alternative_ids
    assert "containers" in alternative_ids
    assert "virtual-machines" in alternative_ids


# ============================================================
# TEST 8
# Trade-off cost calculations should be internally consistent
# ============================================================

def test_tradeoff_cost_difference_is_correct():

    requirements = ApplicationRequirements(
        application_type="Web application",
        expected_users=5000,
        traffic_pattern="Bursty",
        database="none",
        storage_required=True,
        availability="Standard",
        workload_type="event-driven",
        management_preference="low",
        infrastructure_control="low",
        user_priorities=["cost", "scalability"],
        budget=200
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    tradeoffs = generate_tradeoff_analysis(
        evaluation.evaluations,
        evaluation.recommended_architecture_id
    )

    recommended_cost = tradeoffs[
        "recommended_architecture"
    ]["estimated_monthly_cost"]

    for alternative in tradeoffs["alternatives"]:

        alternative_cost = alternative[
            "estimated_monthly_cost"
        ]

        expected_savings = round(
            recommended_cost - alternative_cost,
            2
        )

        actual_savings = alternative[
            "cost_comparison"
        ]["savings"]

        assert actual_savings == expected_savings


# ============================================================
# TEST 9
# Trade-off analysis should report criterion gains or losses
# ============================================================

def test_tradeoff_analysis_contains_criterion_differences():

    requirements = ApplicationRequirements(
        application_type="Traditional server application",
        expected_users=8000,
        traffic_pattern="Steady",
        database="PostgreSQL",
        storage_required=True,
        availability="Standard",
        workload_type="traditional-server",
        management_preference="high-control",
        infrastructure_control="high",
        user_priorities=["infrastructure_control"],
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    tradeoffs = generate_tradeoff_analysis(
        evaluation.evaluations,
        evaluation.recommended_architecture_id
    )

    for alternative in tradeoffs["alternatives"]:

        differences = (
            alternative["gains"] +
            alternative["losses"] +
            alternative["similar"]
        )

        assert len(differences) > 0


# ============================================================
# TEST 10
# All architectures over budget should create budget conflict
# ============================================================

def test_budget_conflict_detected():

    requirements = ApplicationRequirements(
        application_type="Business application",
        expected_users=2000,
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
        budget=7
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    conflicts = detect_constraint_conflicts(
        requirements,
        evaluation.evaluations
    )

    conflict_types = [
        conflict["type"]
        for conflict in conflicts["conflicts"]
    ]

    assert conflicts["has_conflicts"] is True
    assert "BUDGET_CONFLICT" in conflict_types


# ============================================================
# TEST 11
# High control + low management should create a conflict
# ============================================================

def test_control_management_conflict_detected():

    requirements = ApplicationRequirements(
        application_type="Traditional server application",
        expected_users=5000,
        traffic_pattern="Steady",
        database="PostgreSQL",
        storage_required=True,
        availability="Standard",
        workload_type="traditional-server",
        management_preference="low",
        infrastructure_control="high",
        user_priorities=[
            "infrastructure_control",
            "low_management"
        ],
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    conflicts = detect_constraint_conflicts(
        requirements,
        evaluation.evaluations
    )

    conflict_types = [
        conflict["type"]
        for conflict in conflicts["conflicts"]
    ]

    assert "CONTROL_MANAGEMENT_CONFLICT" in conflict_types


# ============================================================
# TEST 12
# Compatible requirements should not create false conflicts
# ============================================================

def test_compatible_requirements_have_no_conflicts():

    requirements = ApplicationRequirements(
        application_type="Web application",
        expected_users=2000,
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
        budget=500
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    conflicts = detect_constraint_conflicts(
        requirements,
        evaluation.evaluations
    )

    assert conflicts["has_conflicts"] is False
    assert conflicts["conflict_count"] == 0
    assert conflicts["conflicts"] == []


# ============================================================
# TEST 13
# High availability + insufficient budget should create
# availability/budget conflict
# ============================================================

def test_high_availability_budget_conflict_detected():

    requirements = ApplicationRequirements(
        application_type="Business application",
        expected_users=10000,
        traffic_pattern="Steady",
        database="PostgreSQL",
        storage_required=True,
        availability="High availability",
        workload_type="containerized",
        management_preference="medium",
        infrastructure_control="medium",
        user_priorities=["availability"],
        budget=10
    )

    architectures, costs, evaluation = run_pipeline(requirements)

    conflicts = detect_constraint_conflicts(
        requirements,
        evaluation.evaluations
    )

    conflict_types = [
        conflict["type"]
        for conflict in conflicts["conflicts"]
    ]

    assert "BUDGET_CONFLICT" in conflict_types

    assert (
        "AVAILABILITY_BUDGET_CONFLICT"
        in conflict_types
    )