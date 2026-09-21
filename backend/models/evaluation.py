from typing import List
from pydantic import BaseModel


class EvaluationCriterion(BaseModel):
    name: str
    score: float
    weight: float
    reason: str


class ArchitectureEvaluation(BaseModel):
    architecture_id: str
    architecture_name: str

    criteria: List[EvaluationCriterion]

    total_score: float

    estimated_monthly_cost: float
    within_budget: bool


class EvaluationResponse(BaseModel):
    evaluations: List[ArchitectureEvaluation]

    recommended_architecture_id: str