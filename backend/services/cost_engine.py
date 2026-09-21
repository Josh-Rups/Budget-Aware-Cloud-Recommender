from typing import List

from backend.models.requirements import ApplicationRequirements
from backend.models.architecture import ArchitectureOption
from backend.models.cost import ServiceCost, ArchitectureCost


# =========================================================
# COST MODEL ASSUMPTIONS
# =========================================================
#
# These values are prototype estimation assumptions.
# They are NOT intended to represent an exact AWS bill.
#
# The goal is to provide a deterministic and explainable
# comparison between architecture options.
# =========================================================

DEFAULT_EXPECTED_USERS = 1000

REQUESTS_PER_USER_PER_MONTH = 300

STORAGE_GB_PER_USER = 0.01


# ---------------------------------------------------------
# REQUEST-BASED PRICING ASSUMPTIONS
# ---------------------------------------------------------

API_GATEWAY_PER_MILLION = 3.50

LAMBDA_REQUEST_PER_MILLION = 0.20

# Simplified Lambda compute allowance per million requests.
LAMBDA_COMPUTE_PER_MILLION = 2.30

DYNAMODB_PER_MILLION_REQUESTS = 1.25


# ---------------------------------------------------------
# STORAGE
# ---------------------------------------------------------

S3_PRICE_PER_GB = 0.023


# ---------------------------------------------------------
# LOAD BALANCER
# ---------------------------------------------------------

ALB_MONTHLY_BASELINE = 20.00


# =========================================================
# EXPECTED USERS
# =========================================================

def get_expected_users(
    requirements: ApplicationRequirements
) -> int:

    """
    Return the provided user count.

    If the user count is missing, use the documented
    prototype assumption of 1,000 users.
    """

    return (
        requirements.expected_users
        or DEFAULT_EXPECTED_USERS
    )


# =========================================================
# WORKLOAD SIZE
# =========================================================

def get_workload_size(
    requirements: ApplicationRequirements
) -> str:

    """
    Classify the application workload using the
    expected number of users.
    """

    users = get_expected_users(
        requirements
    )

    if users < 1000:
        return "small"

    if users <= 5000:
        return "medium"

    if users <= 20000:
        return "large"

    return "very-large"


# =========================================================
# MONTHLY REQUEST ESTIMATION
# =========================================================

def estimate_monthly_requests(
    requirements: ApplicationRequirements
) -> int:

    """
    Estimate monthly requests.

    Base assumption:
    Each active user generates approximately
    300 application requests per month.

    Traffic adjustments:
    Bursty   = +25%
    Seasonal = +15%
    """

    users = get_expected_users(
        requirements
    )

    monthly_requests = (
        users *
        REQUESTS_PER_USER_PER_MONTH
    )


    if requirements.traffic_pattern:

        traffic = (
            requirements
            .traffic_pattern
            .lower()
            .strip()
        )


        if traffic == "bursty":

            monthly_requests = int(
                monthly_requests *
                1.25
            )


        elif traffic == "seasonal":

            monthly_requests = int(
                monthly_requests *
                1.15
            )


    return monthly_requests


# =========================================================
# STORAGE ESTIMATION
# =========================================================

def estimate_storage_gb(
    requirements: ApplicationRequirements
) -> float:

    """
    Estimate S3 storage.

    Prototype assumption:
    Approximately 10 MB (0.01 GB) of stored files
    per expected user.
    """

    if not requirements.storage_required:
        return 0.0


    users = get_expected_users(
        requirements
    )


    storage_gb = (
        users *
        STORAGE_GB_PER_USER
    )


    return round(
        storage_gb,
        2
    )


# =========================================================
# HIGH AVAILABILITY
# =========================================================

def requires_high_availability(
    requirements: ApplicationRequirements
) -> bool:

    """
    Return True only when high availability was
    explicitly requested.

    Missing or unknown availability is treated as
    standard availability.
    """

    if not requirements.availability:
        return False


    availability = (
        requirements
        .availability
        .lower()
        .strip()
    )


    return (
        availability ==
        "high availability"
    )


# =========================================================
# COMPUTE BASELINES
# =========================================================

def get_ec2_baseline(
    workload_size: str
) -> float:

    """
    Prototype EC2 monthly compute assumptions.

    These represent progressively larger compute
    capacity as workload size increases.
    """

    pricing = {
        "small": 18.00,
        "medium": 35.00,
        "large": 70.00,
        "very-large": 140.00
    }

    return pricing[
        workload_size
    ]


def get_fargate_baseline(
    workload_size: str
) -> float:

    """
    Prototype ECS/Fargate monthly compute assumptions.
    """

    pricing = {
        "small": 20.00,
        "medium": 40.00,
        "large": 80.00,
        "very-large": 160.00
    }

    return pricing[
        workload_size
    ]


# =========================================================
# DATABASE BASELINES
# =========================================================

def get_rds_baseline(
    workload_size: str
) -> float:

    """
    Prototype RDS monthly database assumptions.
    """

    pricing = {
        "small": 20.00,
        "medium": 35.00,
        "large": 70.00,
        "very-large": 140.00
    }

    return pricing[
        workload_size
    ]


def get_aurora_baseline(
    workload_size: str
) -> float:

    """
    Prototype Aurora Serverless monthly assumptions.
    """

    pricing = {
        "small": 20.00,
        "medium": 35.00,
        "large": 60.00,
        "very-large": 110.00
    }

    return pricing[
        workload_size
    ]


# =========================================================
# SERVICE COST ESTIMATION
# =========================================================

def estimate_service_cost(
    service_name: str,
    requirements: ApplicationRequirements,
    monthly_requests: int,
    storage_gb: float
) -> ServiceCost:

    service_lower = (
        service_name
        .lower()
        .strip()
    )


    workload_size = get_workload_size(
        requirements
    )


    high_availability = (
        requires_high_availability(
            requirements
        )
    )


    # =====================================================
    # API GATEWAY
    # =====================================================

    if "api gateway" in service_lower:

        request_millions = (
            monthly_requests /
            1_000_000
        )


        cost = (
            request_millions *
            API_GATEWAY_PER_MILLION
        )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=(
                f"{monthly_requests:,} requests/month "
                f"× ${API_GATEWAY_PER_MILLION:.2f} "
                f"per million requests"
            )
        )


    # =====================================================
    # LAMBDA
    # =====================================================

    if "lambda" in service_lower:

        request_millions = (
            monthly_requests /
            1_000_000
        )


        request_cost = (
            request_millions *
            LAMBDA_REQUEST_PER_MILLION
        )


        compute_cost = (
            request_millions *
            LAMBDA_COMPUTE_PER_MILLION
        )


        cost = (
            request_cost +
            compute_cost
        )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=(
                f"{monthly_requests:,} invocations/month; "
                f"simplified request + compute estimate"
            )
        )


    # =====================================================
    # S3
    # =====================================================

    if "s3" in service_lower:

        cost = (
            storage_gb *
            S3_PRICE_PER_GB
        )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=(
                f"{storage_gb:.1f} GB "
                f"× ${S3_PRICE_PER_GB:.3f}/GB"
            )
        )


    # =====================================================
    # AURORA SERVERLESS
    # =====================================================

    if "aurora serverless" in service_lower:

        base_cost = (
            get_aurora_baseline(
                workload_size
            )
        )


        cost = base_cost


        if high_availability:

            cost *= 1.5


        calculation = (
            f"{workload_size.replace('-', ' ')} "
            f"workload database baseline"
        )


        if high_availability:

            calculation += (
                " with high-availability allowance"
            )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=calculation
        )


    # =====================================================
    # APPLICATION LOAD BALANCER
    # =====================================================

    if "load balancer" in service_lower:

        cost = ALB_MONTHLY_BASELINE


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=(
                "Prototype monthly Application "
                "Load Balancer baseline"
            )
        )


    # =====================================================
    # FARGATE / ECS
    # =====================================================

    if (
        "fargate" in service_lower
        or "ecs" in service_lower
    ):

        base_cost = (
            get_fargate_baseline(
                workload_size
            )
        )


        cost = base_cost


        if high_availability:

            cost *= 2


        calculation = (
            f"{workload_size.replace('-', ' ')} "
            f"container compute baseline"
        )


        if high_availability:

            calculation += (
                " with additional capacity "
                "for high availability"
            )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=calculation
        )


    # =====================================================
    # EC2
    # =====================================================

    if "ec2" in service_lower:

        base_cost = (
            get_ec2_baseline(
                workload_size
            )
        )


        cost = base_cost


        if high_availability:

            cost *= 2


        calculation = (
            f"{workload_size.replace('-', ' ')} "
            f"virtual machine compute baseline"
        )


        if high_availability:

            calculation += (
                " with additional capacity "
                "for high availability"
            )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=calculation
        )


    # =====================================================
    # RDS
    # =====================================================

    if "rds" in service_lower:

        base_cost = (
            get_rds_baseline(
                workload_size
            )
        )


        cost = base_cost


        if high_availability:

            cost *= 2


        calculation = (
            f"{workload_size.replace('-', ' ')} "
            f"managed database baseline"
        )


        if high_availability:

            calculation += (
                " with high-availability allowance"
            )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=calculation
        )


    # =====================================================
    # DYNAMODB
    # =====================================================

    if "dynamodb" in service_lower:

        request_millions = (
            monthly_requests /
            1_000_000
        )


        cost = (
            request_millions *
            DYNAMODB_PER_MILLION_REQUESTS
        )


        return ServiceCost(

            service=service_name,

            estimated_monthly_cost=round(
                cost,
                2
            ),

            calculation=(
                f"{monthly_requests:,} estimated "
                f"database requests/month"
            )
        )


    # =====================================================
    # UNKNOWN SERVICE
    # =====================================================

    return ServiceCost(

        service=service_name,

        estimated_monthly_cost=0.00,

        calculation=(
            "No pricing rule is available "
            "for this service."
        )
    )


# =========================================================
# ARCHITECTURE COST
# =========================================================

def calculate_architecture_cost(
    architecture: ArchitectureOption,
    requirements: ApplicationRequirements
) -> ArchitectureCost:

    monthly_requests = (
        estimate_monthly_requests(
            requirements
        )
    )


    storage_gb = (
        estimate_storage_gb(
            requirements
        )
    )


    service_costs: List[
        ServiceCost
    ] = []


    for service in architecture.services:

        service_cost = (
            estimate_service_cost(
                service.name,
                requirements,
                monthly_requests,
                storage_gb
            )
        )


        service_costs.append(
            service_cost
        )


    total = sum(
        item.estimated_monthly_cost
        for item in service_costs
    )


    total = round(
        total,
        2
    )


    return ArchitectureCost(

        architecture_id=
            architecture.id,

        services=
            service_costs,

        total_monthly_cost=
            total,

        within_budget=(
            total <=
            requirements.budget
        )
    )


# =========================================================
# CALCULATE ALL ARCHITECTURES
# =========================================================

def calculate_all_costs(
    architectures: List[
        ArchitectureOption
    ],
    requirements: ApplicationRequirements
) -> List[ArchitectureCost]:

    return [

        calculate_architecture_cost(
            architecture,
            requirements
        )

        for architecture
        in architectures
    ]


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    from backend.services.architecture_engine import (
        generate_architectures
    )


    test_requirements = (
        ApplicationRequirements(

            application_type=
                "online store",

            expected_users=
                8000,

            traffic_pattern=
                "Steady",

            database=
                "MySQL",

            storage_required=
                True,

            availability=
                "Standard",

            workload_type=
                "general",

            management_preference=
                "medium",

            infrastructure_control=
                "medium",

            region=
                "us-east-1",

            budget=
                500
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


    print(
        "\n================================"
    )

    print(
        "COST ESTIMATION TEST"
    )

    print(
        "================================"
    )


    print(
        f"Users: "
        f"{get_expected_users(test_requirements):,}"
    )


    print(
        f"Workload size: "
        f"{get_workload_size(test_requirements)}"
    )


    print(
        f"Monthly requests: "
        f"{estimate_monthly_requests(test_requirements):,}"
    )


    print(
        f"Estimated storage: "
        f"{estimate_storage_gb(test_requirements):.1f} GB"
    )


    print(
        f"Availability: "
        f"{test_requirements.availability}"
    )


    print(
        f"Budget: "
        f"${test_requirements.budget:.2f}/month"
    )


    for architecture_cost in costs:

        print(
            "\n--------------------------------"
        )

        print(
            architecture_cost
            .architecture_id
            .upper()
        )

        print(
            "--------------------------------"
        )


        for service in architecture_cost.services:

            print(
                f"{service.service}: "
                f"${service.estimated_monthly_cost:.2f}"
            )


            print(
                f"  {service.calculation}"
            )


        print(
            f"\nTOTAL: "
            f"${architecture_cost.total_monthly_cost:.2f}"
        )


        print(
            "WITHIN BUDGET:",
            "YES"
            if architecture_cost.within_budget
            else "NO"
        )