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
# USER PRIORITY LABELS
# =========================================================

PRIORITY_LABELS = {

    "cost":
        "Lowest cost",

    "low_management":
        "Less infrastructure management",

    "infrastructure_control":
        "Maximum infrastructure control",

    "scalability":
        "High scalability",

    "availability":
        "High availability",

    "balanced":
        "Balanced / recommend for me"
}


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

        "name":
            architecture.name,

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
    # PREPARE USER PRIORITIES
    # -----------------------------------------------------

    selected_priorities = (
        requirements.user_priorities
        or []
    )

    user_priorities = [

        PRIORITY_LABELS.get(
            priority,
            priority
        )

        for priority in selected_priorities
    ]


    # -----------------------------------------------------
    # PRIORITY STATUS
    # -----------------------------------------------------

    if not user_priorities:

        priority_status = (
            "No explicit user priorities were selected. "
            "The default balanced evaluation weights were used."
        )

    elif "balanced" in selected_priorities:

        priority_status = (
            "The user selected the Balanced / recommend for me "
            "option. The default evaluation weights were used. "
            "Balanced does not increase or decrease the weight "
            "of any individual evaluation criterion."
        )

    else:

        priority_status = (
            "The user explicitly selected these priorities: "
            + ", ".join(user_priorities)
            + ". These are preferences that influenced the "
              "deterministic evaluation weights. They are not "
              "automatically technical requirements, and the "
              "recommended architecture may involve trade-offs "
              "against one or more of them."
        )


    # -----------------------------------------------------
    # PREPARE AVAILABILITY CONTEXT
    # -----------------------------------------------------

    availability_requirement = (
        requirements.availability
    )

    availability_is_known = bool(
        availability_requirement
        and availability_requirement.lower().strip()
        not in [
            "unknown",
            "not sure",
            "unspecified",
            "none"
        ]
    )

    availability_is_priority = (
        "availability"
        in selected_priorities
    )


    if availability_is_known:

        availability_context = (
            "The user explicitly provided this technical "
            "availability requirement: "
            f"{availability_requirement}."
        )

    elif availability_is_priority:

        availability_context = (
            "The user did not provide an explicit technical "
            "availability requirement. However, High availability "
            "was selected as a user priority. Treat it as a "
            "preference that influenced the evaluation, not as a "
            "confirmed technical requirement."
        )

    else:

        availability_context = (
            "The user did not provide an explicit technical "
            "availability requirement."
        )


    # -----------------------------------------------------
    # PREPARE PRIORITY TRADE-OFF CONTEXT
    # -----------------------------------------------------

    priority_tradeoffs = []


    # High scalability priority
    if "scalability" in selected_priorities:

        scalability = (
            architecture.scalability
            or ""
        ).lower().strip()

        if scalability == "high":

            priority_tradeoffs.append(
                "The architecture strongly supports the user's "
                "High scalability priority because its scalability "
                "is High."
            )

        elif scalability == "medium":

            priority_tradeoffs.append(
                "The user selected High scalability as a priority, "
                "but this architecture provides Medium scalability. "
                "This is a trade-off and must not be described as "
                "fully satisfying or aligning with the priority."
            )

        else:

            priority_tradeoffs.append(
                "The user selected High scalability as a priority, "
                "but this architecture does not provide High "
                "scalability. This is a trade-off."
            )


    # Less management priority
    if "low_management" in selected_priorities:

        management = (
            architecture.management_effort
            or ""
        ).lower().strip()

        if management == "low":

            priority_tradeoffs.append(
                "The architecture strongly supports the user's "
                "Less infrastructure management priority because "
                "its management effort is Low."
            )

        elif management == "medium":

            priority_tradeoffs.append(
                "The user selected Less infrastructure management "
                "as a priority, but this architecture has Medium "
                "management effort. This is a trade-off."
            )

        elif management == "high":

            priority_tradeoffs.append(
                "The user selected Less infrastructure management "
                "as a priority, but this architecture has High "
                "management effort. This priority is not strongly "
                "satisfied and must be described as a trade-off."
            )


    # Maximum control priority
    if "infrastructure_control" in selected_priorities:

        if architecture.name.lower() == "ec2":

            priority_tradeoffs.append(
                "The EC2 architecture strongly supports the user's "
                "Maximum infrastructure control priority because "
                "it provides direct server and operating system "
                "control."
            )

        elif architecture.name.lower() == "containers":

            priority_tradeoffs.append(
                "The user selected Maximum infrastructure control "
                "as a priority. Containers provide some "
                "infrastructure control, but less direct server "
                "control than EC2. This is a partial trade-off."
            )

        else:

            priority_tradeoffs.append(
                "The user selected Maximum infrastructure control "
                "as a priority, but this architecture provides "
                "limited direct infrastructure control. This is "
                "a trade-off."
            )


    # Lowest cost priority
    if "cost" in selected_priorities:

        if cost.within_budget:

            priority_tradeoffs.append(
                "The architecture is within the user's monthly "
                "budget. Lowest cost was selected as a user "
                "priority and influenced the deterministic "
                "evaluation."
            )

        else:

            priority_tradeoffs.append(
                "Lowest cost was selected as a user priority, "
                "but the recommended architecture is still over "
                "the monthly budget. Do not claim that the cost "
                "priority is fully satisfied."
            )


    # High availability priority
    if "availability" in selected_priorities:

        if availability_is_known:

            priority_tradeoffs.append(
                "High availability was selected as a user priority, "
                "and an explicit availability requirement was also "
                "provided. Use the evaluation evidence when "
                "explaining how well the architecture supports it."
            )

        else:

            priority_tradeoffs.append(
                "High availability was selected as a user priority, "
                "but no explicit availability requirement was "
                "provided. Describe it only as a preference that "
                "influenced the evaluation."
            )


    # Balanced option
    if "balanced" in selected_priorities:

        priority_tradeoffs.append(
            "Balanced / recommend for me was selected. "
            "The default evaluation weights were used. "
            "Balanced did not increase or decrease the importance "
            "of any individual criterion."
        )


    if priority_tradeoffs:

        priority_tradeoff_context = "\n".join(
            f"- {item}"
            for item in priority_tradeoffs
        )

    else:

        priority_tradeoff_context = (
            "No specific priority trade-off guidance is required."
        )


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

The Python engine evaluated:

1. Technical requirements
2. Budget constraints
3. User-selected priorities

Your job is ONLY to explain the existing decision.


IMPORTANT RULES:

- Do not choose a different architecture.
- Do not change the recommendation.
- Do not calculate a new architecture score.
- Do not calculate new AWS costs.
- Do not perform percentage calculations.
- Do not invent requirements.
- Do not invent user priorities.
- Do not invent AWS services.
- Do not invent prices.
- Use only the information provided below.
- Use the estimated monthly cost exactly as provided.
- Use the monthly budget exactly as provided.
- Follow the provided budget status exactly.
- Do not recommend an alternative architecture.
- Do not override the Python decision engine.

- Clearly distinguish technical requirements from
  user-selected priorities.

- Technical requirements describe what the application
  needs.

- User priorities describe what the user values most
  when comparing architecture options.

- A user priority does not automatically become a
  technical requirement.

- User priorities influence the recommendation, but
  they do not automatically override important
  technical requirements or budget constraints.

- The user priorities below have already been handled
  by the deterministic Python evaluation engine.

- Do not independently decide how much importance
  a priority should receive.

- Do not calculate or change evaluation weights.

- A selected user priority may influence the evaluation
  even when the recommended architecture does not
  strongly satisfy that priority.

- Never claim that an architecture "aligns with",
  "strongly supports", "fully satisfies", or "meets"
  a user priority unless the architecture characteristics
  and evaluation evidence support that statement.

- If the recommended architecture does not strongly
  satisfy a selected priority, explicitly describe
  this as a trade-off.

- Do not turn an architecture weakness into a strength.

- Medium scalability does not fully satisfy a
  High scalability priority.

- High management effort does not satisfy a
  Less infrastructure management priority.

- Medium management effort only partially satisfies
  a Less infrastructure management priority.

- Limited infrastructure control does not satisfy a
  Maximum infrastructure control priority.

- If technical requirements outweigh conflicting
  user priorities, explain that the architecture was
  selected because of its stronger technical fit while
  acknowledging the priorities that were compromised.

- Do not pretend that every technical requirement and
  every user priority point toward the same architecture.

- When a trade-off exists, state it clearly and
  neutrally.


BALANCED OPTION RULES:

- "Balanced / recommend for me" does not increase or
  decrease any evaluation criterion.

- When Balanced is selected, the deterministic engine
  uses the default evaluation weights.

- Do not say that Balanced changed, increased, decreased,
  boosted, or reduced any evaluation weight.

- Do not describe Balanced as a preference for cost,
  scalability, management, control, availability,
  or workload fit.

- Do not say that Balanced influenced the evaluation
  by giving additional importance to any criterion.

- When mentioning Balanced, say that the default
  evaluation weights were used.

- Balanced means that no additional user-priority
  weighting was applied.


AVAILABILITY RULES:

- If availability is unknown but High availability
  is a selected user priority, describe it as a user
  priority that influenced the evaluation.

- Do not call High availability a technical requirement
  unless USER REQUIREMENTS explicitly provides a known
  availability requirement.

- Do not say that the architecture meets, satisfies,
  or aligns with a High availability requirement when
  availability is unknown.

- If availability is unknown and High availability is
  selected as a priority, wording such as
  "High availability was selected as a user priority
  and influenced the evaluation" is appropriate.


BUDGET RULES:

- If the architecture is over budget, clearly state
  that it is over budget.

- Do not state a percentage over or under budget unless
  an exact percentage is explicitly provided in the input.

- Do not claim that an architecture is within budget
  when the provided budget status says it is over budget.


RECOMMENDED ARCHITECTURE:

{json.dumps(
    architecture_data,
    indent=2
)}


USER REQUIREMENTS:

{requirements.model_dump_json(
    indent=2
)}


USER-SELECTED PRIORITIES:

{json.dumps(
    user_priorities,
    indent=2
)}


PRIORITY STATUS:

{priority_status}


AVAILABILITY CONTEXT:

{availability_context}


PRIORITY TRADE-OFF CONTEXT:

{priority_tradeoff_context}


EVALUATION:

{json.dumps(
    criteria_data,
    indent=2
)}


ESTIMATED MONTHLY COST:

${cost.total_monthly_cost:.2f}


MONTHLY BUDGET:

${requirements.budget:.2f}


BUDGET STATUS:

{budget_status}


Write a clear explanation of why the selected architecture
was recommended for this user.

RESPONSE REQUIREMENTS:

- Use simple, natural English.
- Write 3 to 5 short sentences in one paragraph.
- Address the user directly using "you" and "your".
- Return only the explanation.
- Do not use markdown or bullet points.
- Avoid repeating the same reason.

EXPLANATION STRUCTURE:

1. Explain why the selected architecture fits the
   user's application requirements.

2. Explain how the user's selected priorities
   influenced the recommendation.
   Mention relevant management, scalability,
   availability, or infrastructure control trade-offs.

3. Explain any important limitation of the selected
   architecture, using the evaluation evidence.

4. Mention the estimated monthly cost and budget.
   State clearly whether the architecture is within
   or over budget.

5. If the architecture is over budget, explain that
   the user may need to increase their budget or
   reconsider their requirements.
   Do not invent cost savings or claim that a
   particular change will reduce costs.

ACCURACY RULES:

- The architecture was already selected by Python.
  Do not select another architecture.

- Do not invent reasons, requirements, services,
  costs, or evaluation results.

- Do not claim that the selected architecture is
  cheaper than other options because their costs
  have not been provided.

- Do not claim that another architecture performs
  worse because its evaluation has not been provided.

- Explain only what the supplied evidence supports.

- Treat user priorities as preferences, not
  automatically confirmed technical requirements.

- Do not describe a preference as fully satisfied
  when the evidence shows a trade-off.

- Do not say that all architecture options exceed
  the budget unless that information was provided.

- Do not perform new calculations.

- If the user selected Balanced, explain that the
  default evaluation weights were used.

- Keep the explanation consistent with the supplied
  budget status and evaluation results.
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
            "maxTokens": 450,
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