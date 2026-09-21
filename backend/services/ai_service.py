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

Rules for the new fields:

workload_type:
- "event-driven" only if the description clearly describes events,
  functions, triggers, asynchronous processing, or similar workloads.
- "containerized" only if the user mentions containers, Docker,
  ECS, Kubernetes, Fargate, or a container-based application.
- "traditional-server" only if the user clearly describes a
  traditional server, VM, EC2, or continuously running server workload.
- "general" if the application type is known but none of the
  specialized workload types above are stated.
- null if there is not enough information.

management_preference:
- "low" if the user explicitly wants minimal infrastructure or
  server management.
- "medium" if the user explicitly accepts some infrastructure
  management.
- "high-control" if the user explicitly wants to manage servers
  or infrastructure directly.
- null if not stated.

infrastructure_control:
- "low" if the user explicitly wants managed infrastructure
  and little direct control.
- "medium" if the user explicitly wants some infrastructure control.
- "high" if the user explicitly needs operating system, server,
  networking, or instance-level control.
- null if not stated.

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

    data = json.loads(response_text)

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


if __name__ == "__main__":

    result = analyze_requirements(
        description=(
            "I want to build a Docker-based web application "
            "for 8000 users using PostgreSQL. "
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