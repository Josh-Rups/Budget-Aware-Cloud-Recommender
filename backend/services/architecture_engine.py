from typing import List, Optional, Tuple

from backend.models.requirements import ApplicationRequirements
from backend.models.architecture import AWSService, ArchitectureOption


# =========================================================
# DATABASE SERVICE SELECTION
# =========================================================

def get_database_services(
    database: Optional[str]
) -> Tuple[Optional[str], Optional[str]]:

    # No database requirement was provided.
    if not database:
        return None, None

    database_lower = database.lower().strip()

    # User explicitly does not need a database.
    if database_lower in [
        "none",
        "no database"
    ]:
        return None, None

    # Database requirement is unknown.
    # Do not invent a database service.
    if database_lower in [
        "unknown",
        "not sure",
        "unspecified"
    ]:
        return None, None

    # MySQL
    if "mysql" in database_lower:
        return (
            "Amazon Aurora Serverless (MySQL-compatible)",
            "Amazon RDS for MySQL"
        )

    # PostgreSQL
    if (
        "postgres" in database_lower
        or "postgresql" in database_lower
    ):
        return (
            "Amazon Aurora Serverless (PostgreSQL-compatible)",
            "Amazon RDS for PostgreSQL"
        )

    # NoSQL / DynamoDB
    if (
        "dynamodb" in database_lower
        or "nosql" in database_lower
    ):
        return (
            "Amazon DynamoDB",
            "Amazon DynamoDB"
        )

    # Unrecognized database type.
    # Do not make an assumption.
    return None, None


# =========================================================
# GENERATE ARCHITECTURE OPTIONS
# =========================================================

def generate_architectures(
    requirements: ApplicationRequirements
) -> List[ArchitectureOption]:

    architectures = []

    serverless_database, traditional_database = (
        get_database_services(
            requirements.database
        )
    )


    # =====================================================
    # OPTION 1 - SERVERLESS
    # =====================================================

    serverless_services = [

        AWSService(
            name="Amazon API Gateway",
            role="API"
        ),

        AWSService(
            name="AWS Lambda",
            role="Compute"
        )
    ]


    # Add S3 only when file storage is explicitly required.
    if requirements.storage_required:

        serverless_services.append(

            AWSService(
                name="Amazon S3",
                role="File storage"
            )
        )


    # Add a database only when the requirement is known.
    if serverless_database:

        serverless_services.append(

            AWSService(
                name=serverless_database,
                role="Database"
            )
        )


    architectures.append(

        ArchitectureOption(

            id="serverless",

            name="Serverless",

            description=(
                "Managed, usage-based AWS architecture"
            ),

            services=serverless_services,

            scalability="High",

            management_effort="Low"
        )
    )


    # =====================================================
    # OPTION 2 - CONTAINERS
    # =====================================================

    container_services = [

        AWSService(
            name="Application Load Balancer",
            role="Traffic"
        ),

        AWSService(
            name="Amazon ECS with AWS Fargate",
            role="Compute"
        )
    ]


    # Add S3 only when file storage is explicitly required.
    if requirements.storage_required:

        container_services.append(

            AWSService(
                name="Amazon S3",
                role="File storage"
            )
        )


    # Add a database only when the requirement is known.
    if traditional_database:

        container_services.append(

            AWSService(
                name=traditional_database,
                role="Database"
            )
        )


    architectures.append(

        ArchitectureOption(

            id="containers",

            name="Containers",

            description=(
                "Container-based AWS architecture"
            ),

            services=container_services,

            scalability="High",

            management_effort="Medium"
        )
    )


    # =====================================================
    # OPTION 3 - EC2
    # =====================================================

    vm_services = [

        AWSService(
            name="Application Load Balancer",
            role="Traffic"
        ),

        AWSService(
            name="Amazon EC2",
            role="Compute"
        )
    ]


    # Add S3 only when file storage is explicitly required.
    if requirements.storage_required:

        vm_services.append(

            AWSService(
                name="Amazon S3",
                role="File storage"
            )
        )


    # Add a database only when the requirement is known.
    if traditional_database:

        vm_services.append(

            AWSService(
                name=traditional_database,
                role="Database"
            )
        )


    architectures.append(

        ArchitectureOption(

            id="virtual-machines",

            name="EC2",

            description=(
                "Traditional virtual server architecture"
            ),

            services=vm_services,

            scalability="Medium",

            management_effort="High"
        )
    )


    return architectures


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    test_requirements = ApplicationRequirements(

        application_type="web application",

        expected_users=5000,

        traffic_pattern="Steady",

        # Test unknown database handling.
        database="Unknown",

        storage_required=True,

        availability="Standard",

        workload_type="general",

        management_preference="medium",

        infrastructure_control="medium",

        region="us-east-1",

        budget=500
    )


    results = generate_architectures(
        test_requirements
    )


    for architecture in results:

        print(
            "\nARCHITECTURE:",
            architecture.name
        )

        print(
            "ID:",
            architecture.id
        )

        print(
            "Scalability:",
            architecture.scalability
        )

        print(
            "Management:",
            architecture.management_effort
        )

        print("Services:")

        for service in architecture.services:

            print(
                " -",
                service.name,
                "|",
                service.role
            )