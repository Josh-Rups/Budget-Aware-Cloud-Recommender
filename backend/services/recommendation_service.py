import json
import boto3

from backend.models.requirements import ApplicationRequirements
from backend.models.architecture import ArchitectureOption
from backend.models.cost import ArchitectureCost
from backend.models.evaluation import ArchitectureEvaluation


# =========================================================
# BEDROCK CONFIGURATION
# =========================================================

REGION = "us-east-1"
MODEL_ID = "amazon.nova-pro-v1:0"


bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=REGION
)


# =========================================================
# GENERATE RECOMMENDATION EXPLANATION
# =========================================================

def generate_recommendation_explanation(
    requirements: ApplicationRequirements,
    architecture: ArchitectureOption,
    cost: ArchitectureCost,
    evaluation: ArchitectureEvaluation
) -> str:

    # -----------------------------------------------------
    # PREPARE EVALUATION DATA
    # -----------------------------------------------------

    criteria_data = []

    for criterion in evaluation.criteria:

        criteria_data.append({
            "name": criterion.name,
            "score": criterion.score,
            "weight": criterion.weight,
            "reason": criterion.reason
        })


    # -----------------------------------------------------
    # PREPARE ARCHITECTURE DATA
    # -----------------------------------------------------

    architecture_data = {

        "name": architecture.name,

        "description":
            architecture.description,

        "services": [
            {
                "name": service.name,
                "role": service.role
            }
            for service in architecture.services
        ],

        "scalability":
            architecture.scalability,

        "management_effort":
            architecture.management_effort
    }


    # -----------------------------------------------------
    # DETERMINE BUDGET STATUS
    # -----------------------------------------------------

    if cost.within_budget:

        budget_status = (
            "The estimated monthly cost is "
            "within the user's monthly budget."
        )

    else:

        budget_status = (
            "The estimated monthly cost is "
            "over the user's monthly budget."
        )


    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are explaining the result of a cloud architecture
recommendation system.

The architecture has already been selected by a
deterministic Python decision engine.

Your job is ONLY to explain the existing decision.

IMPORTANT RULES:

- Do not choose a different architecture.
- Do not change the recommendation.
- Do not calculate a new architecture score.
- Do not calculate new AWS costs.
- Do not perform percentage calculations.
- Do not invent requirements.
- Do not invent AWS services.
- Do not invent prices.
- Use only the information provided below.
- Use the estimated monthly cost exactly as provided.
- Use the monthly budget exactly as provided.
- If the architecture is over budget, simply state that
  it is over budget.
- Do not state a percentage over or under budget unless
  an exact percentage is explicitly provided in the input.
- Do not claim that an architecture is within budget when
  the provided budget status says it is over budget.
- Do not recommend an alternative architecture.
- Do not override the Python decision engine.


RECOMMENDED ARCHITECTURE:

{json.dumps(architecture_data, indent=2)}


USER REQUIREMENTS:

{requirements.model_dump_json(indent=2)}


EVALUATION:

{json.dumps(criteria_data, indent=2)}


ESTIMATED MONTHLY COST:

${cost.total_monthly_cost:.2f}


MONTHLY BUDGET:

${requirements.budget:.2f}


BUDGET STATUS:

{budget_status}


Write a short explanation of why this architecture was selected.

Response requirements:

- Use simple and natural English.
- Use 2 to 4 sentences.
- Explain the strongest technical reasons for the selection.
- Mention important workload requirements when relevant.
- Mention management or infrastructure control when relevant.
- Mention scalability when relevant.
- Mention the estimated monthly cost.
- Mention the monthly budget.
- Follow the provided budget status exactly.
- If the architecture is over budget, clearly say so.
- Explain that it is the closest fit if no option fits the budget.
- Do not perform your own calculations.
- Do not include markdown.
- Do not use bullet points.
- Return only the explanation.
"""


    # -----------------------------------------------------
    # CALL AMAZON BEDROCK
    # -----------------------------------------------------

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
            "maxTokens": 300,
            "temperature": 0
        }
    )


    # -----------------------------------------------------
    # EXTRACT RESPONSE
    # -----------------------------------------------------

    explanation = (
        response[
            "output"
        ][
            "message"
        ][
            "content"
        ][0][
            "text"
        ]
    )


    return explanation.strip()