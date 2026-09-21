from typing import List
from pydantic import BaseModel


class AWSService(BaseModel):
    name: str
    role: str


class ArchitectureOption(BaseModel):
    id: str
    name: str
    description: str
    services: List[AWSService]
    scalability: str
    management_effort: str


class ArchitectureResponse(BaseModel):
    architectures: List[ArchitectureOption]