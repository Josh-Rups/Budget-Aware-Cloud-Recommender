from fastapi import FastAPI
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.models.requirements import ApplicationRequirements
from backend.models.architecture import ArchitectureResponse
from backend.models.cost import ArchitectureCost
from backend.models.evaluation import EvaluationResponse

from backend.services.ai_service import analyze_requirements
from backend.services.architecture_engine import generate_architectures
from backend.services.cost_engine import calculate_all_costs
from backend.services.evaluation_engine import evaluate_architectures

from backend.services.recommendation_service import (
    generate_recommendation_explanation
)

from backend.services.assumption_service import (
    generate_assumptions
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Budget-Aware Cloud Recommender API",
    version="0.1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ApplicationRequest(BaseModel):

    description: str = Field(
        min_length=10,
        max_length=2000
    )

    budget: float = Field(
        gt=0
    )


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "Cloud Architecture Recommender API is running"
    }


# =========================================================
# AI REQUIREMENT ANALYSIS
# =========================================================

@app.post(
    "/api/analyze",
    response_model=ApplicationRequirements
)
def analyze_application(
    request: ApplicationRequest
):

    requirements = analyze_requirements(
        description=request.description,
        budget=request.budget
    )

    return requirements


# =========================================================
# ARCHITECTURE GENERATION
# =========================================================

@app.post(
    "/api/architectures",
    response_model=ArchitectureResponse
)
def create_architectures(
    requirements: ApplicationRequirements
):

    architectures = generate_architectures(
        requirements
    )

    return ArchitectureResponse(
        architectures=architectures
    )


# =========================================================
# COST ESTIMATION
# =========================================================

@app.post(
    "/api/costs",
    response_model=List[ArchitectureCost]
)
def calculate_costs(
    requirements: ApplicationRequirements
):

    # Generate architecture options
    architectures = generate_architectures(
        requirements
    )

    # Calculate cost for each architecture
    costs = calculate_all_costs(
        architectures,
        requirements
    )

    return costs


# =========================================================
# ARCHITECTURE EVALUATION
# =========================================================

@app.post(
    "/api/evaluate",
    response_model=EvaluationResponse
)
def evaluate_options(
    requirements: ApplicationRequirements
):

    # Generate architecture options
    architectures = generate_architectures(
        requirements
    )

    # Calculate architecture costs
    costs = calculate_all_costs(
        architectures,
        requirements
    )

    # Evaluate and rank architectures
    evaluation = evaluate_architectures(
        architectures,
        costs,
        requirements
    )

    return evaluation


# =========================================================
# FINAL RECOMMENDATION
# =========================================================

@app.post("/api/recommendation")
def generate_recommendation(
    requirements: ApplicationRequirements
):

    # -----------------------------------------------------
    # 1. Generate architecture options
    # -----------------------------------------------------

    architectures = generate_architectures(
        requirements
    )


    # -----------------------------------------------------
    # 2. Calculate costs
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
    # 4. Get architecture selected by Python
    # -----------------------------------------------------

    recommended_id = (
        evaluation_result.recommended_architecture_id
    )


    recommended_architecture = next(
        architecture
        for architecture in architectures
        if architecture.id == recommended_id
    )


    # -----------------------------------------------------
    # 5. Get recommended architecture cost
    # -----------------------------------------------------

    recommended_cost = next(
        cost
        for cost in costs
        if cost.architecture_id == recommended_id
    )


    # -----------------------------------------------------
    # 6. Get recommended architecture evaluation
    # -----------------------------------------------------

    recommended_evaluation = next(
        evaluation
        for evaluation in evaluation_result.evaluations
        if evaluation.architecture_id == recommended_id
    )


    # -----------------------------------------------------
    # 7. Generate assumptions
    # -----------------------------------------------------

    assumptions = generate_assumptions(
        requirements
    )


    # -----------------------------------------------------
    # 8. Ask Bedrock to explain the existing decision
    # -----------------------------------------------------

    explanation = generate_recommendation_explanation(
        requirements=requirements,
        architecture=recommended_architecture,
        cost=recommended_cost,
        evaluation=recommended_evaluation
    )


    # -----------------------------------------------------
    # 9. Return final recommendation
    # -----------------------------------------------------

    return {
        "recommended_architecture_id":
            recommended_id,

        "architecture_name":
            recommended_architecture.name,

        "estimated_monthly_cost":
            recommended_cost.total_monthly_cost,

        "within_budget":
            recommended_cost.within_budget,

        "explanation":
            explanation,

        "assumptions":
            assumptions
    }