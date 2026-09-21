from typing import Optional
from pydantic import BaseModel, Field


class ApplicationRequirements(BaseModel):

    application_type: Optional[str] = None

    expected_users: Optional[int] = Field(
        default=None,
        ge=1
    )

    traffic_pattern: Optional[str] = None

    database: Optional[str] = None

    storage_required: Optional[bool] = None

    availability: Optional[str] = None

    # Architecture-specific requirements

    workload_type: Optional[str] = None
    # Examples:
    # "event-driven"
    # "containerized"
    # "traditional-server"
    # "general"

    management_preference: Optional[str] = None
    # Examples:
    # "low"
    # "medium"
    # "high-control"

    infrastructure_control: Optional[str] = None
    # Examples:
    # "low"
    # "medium"
    # "high"

    region: str = "us-east-1"

    budget: float = Field(
        gt=0
    )