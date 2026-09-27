from typing import List, Optional

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

    # User-selected decision priorities.
    # These influence evaluation but do not directly
    # choose an architecture.
    user_priorities: List[str] = Field(
        default_factory=list
    )
    # Possible values:
    # "cost"
    # "low_management"
    # "infrastructure_control"
    # "scalability"
    # "availability"
    # "balanced"

    region: str = "us-east-1"

    budget: float = Field(
        gt=0
    )