import json
import boto3

from backend.models.requirements import ApplicationRequirements


REGION = "us-east-1"
MODEL_ID = "amazon.nova-pro-v1:0"


bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=REGION
)


def analyze_requirements(
    description: str,
    budget: float
) -> ApplicationRequirements:

    prompt = f"""
You are a cloud application requirements analyzer.

Analyze the user's application description and extract only information
that the user actually provided.

Do not invent missing requirements.
If a value cannot be determined from the description, return null.

Return ONLY valid JSON.
Do not include markdown, explanations, or code blocks.

Use exactly this structure:

{{
    "application_type": string or null,
    "expected_users": integer or null,
    "traffic_pattern": string or null,
    "database": string or null,
    "storage_required": boolean or null,
    "availability": string or null,
    "workload_type": string or null,
    "management_preference": string or null,
    "infrastructure_control": string or null
}}

Rules for the fields:

application_type:
- Return a short application type only when it can be determined.
- Examples include:
  "web application",
  "API",
  "mobile backend",
  "data processing application".
- Return null if the application type cannot be determined.


expected_users:
- Return an integer only when the user gives a user count
  or a clearly stated approximate user count.
- Do not estimate the number of users.
- Return null if not stated.


traffic_pattern:
- Return "Steady" when the user explicitly describes
  stable or consistent traffic.
- Return "Bursty" when the user explicitly describes
  sudden traffic spikes or unpredictable bursts.
- Return "Seasonal" when the user explicitly describes
  traffic that changes during particular periods,
  events, or seasons.
- Return null if the traffic pattern is not stated.


database:
- Return "MySQL" only if the user explicitly requests MySQL.
- Return "PostgreSQL" only if the user explicitly requests
  PostgreSQL or Postgres.
- Return "DynamoDB" only if the user explicitly requests DynamoDB.
- Return "NoSQL" only if the user explicitly requests a NoSQL
  database without naming a specific supported NoSQL database.
- Return "none" only if the user explicitly says that no
  database is needed.
- If the user says that a database is required or needed
  but does not specify the database type, return null.
- Never return values such as:
  "required",
  "needed",
  "yes",
  "database",
  or "relational".
- Do not choose a database technology for the user.
- Return null when the database type cannot be determined.


storage_required:
- Return true only when the user clearly requires file,
  object, image, document, media, upload, or similar storage.
- Return false only when the user explicitly indicates that
  this type of storage is not required.
- Return null if it cannot be determined.


availability:
- Return "High availability" only when the user explicitly
  requests high availability, redundancy, fault tolerance,
  or similar availability requirements.
- Return "Standard" only when the user explicitly indicates
  that standard availability is acceptable.
- Return null if availability is not stated.


workload_type:
- Return "event-driven" only if the description clearly
  describes events, functions, triggers, asynchronous
  processing, or similar workloads.
- Return "containerized" only if the user mentions containers,
  Docker, ECS, Kubernetes, Fargate, or a container-based
  application.
- Return "traditional-server" only if the user clearly
  describes a traditional server, VM, EC2, or continuously
  running server workload.
- Return "general" if the application type is known but none
  of the specialized workload types above are stated.
- Return null if there is not enough information.


management_preference:
- Return "low" if the user explicitly wants minimal
  infrastructure or server management.
- Return "medium" if the user explicitly accepts some
  infrastructure management.
- Return "high-control" if the user explicitly wants to
  manage servers or infrastructure directly.
- Return null if not stated.


infrastructure_control:
- Return "low" if the user explicitly wants managed
  infrastructure and little direct control.
- Return "medium" if the user explicitly wants some
  infrastructure control.
- Return "high" if the user explicitly needs operating
  system, server, networking, or instance-level control.
- Return null if not stated.


Important:
- Extract requirements only.
- Do not recommend AWS services.
- Do not select an architecture.
- Do not calculate costs.
- Do not infer unstated requirements.
- Do not convert an unknown database requirement into
  a specific database technology.


Application description:
{description}
"""

    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 700,
            "temperature": 0
        }
    )


    response_text = (
        response["output"]
        ["message"]
        ["content"][0]
        ["text"]
    )


    data = json.loads(
        response_text
    )


    requirements = ApplicationRequirements(

        application_type=data.get(
            "application_type"
        ),

        expected_users=data.get(
            "expected_users"
        ),

        traffic_pattern=data.get(
            "traffic_pattern"
        ),

        database=data.get(
            "database"
        ),

        storage_required=data.get(
            "storage_required"
        ),

        availability=data.get(
            "availability"
        ),

        workload_type=data.get(
            "workload_type"
        ),

        management_preference=data.get(
            "management_preference"
        ),

        infrastructure_control=data.get(
            "infrastructure_control"
        ),

        region=REGION,

        budget=budget
    )


    return requirements


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    result = analyze_requirements(

        description=(
            "I want to build a Docker-based web application "
            "for 5000 users using PostgreSQL."
            "I want to use containers and I am comfortable "
            "with some infrastructure management."
        ),

        budget=500
    )


    print(
        result.model_dump_json(
            indent=2
        )
    )