from typing import Dict, Type
from app.agents.base import BaseAgent

_agent_registry: Dict[str, Type[BaseAgent]] = {}


def register_agent(agent_class: Type[BaseAgent]):
    """Decorator to register an agent."""
    _agent_registry[agent_class.get_source_type()] = agent_class
    return agent_class


def get_agent(source_type: str) -> BaseAgent | None:
    """Get an agent instance by source type."""
    agent_class = _agent_registry.get(source_type)
    if agent_class:
        return agent_class()
    return None


def list_agents() -> list[str]:
    """List all registered agent types."""
    return list(_agent_registry.keys())
