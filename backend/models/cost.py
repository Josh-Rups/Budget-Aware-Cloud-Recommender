from typing import List
from pydantic import BaseModel


class ServiceCost(BaseModel):
    service: str
    estimated_monthly_cost: float
    calculation: str


class ArchitectureCost(BaseModel):
    architecture_id: str
    services: List[ServiceCost]
    total_monthly_cost: float
    within_budget: bool