from abc import ABC, abstractmethod
from typing import TypedDict
from langgraph.graph import StateGraph, END, START


class AgentState(TypedDict):
    """Base state for all agents."""
    raw_content: str
    processed_content: str | None
    metadata: dict | None
    error: str | None


class BaseAgent(ABC):
    """Abstract base class for content processing agents."""

    @classmethod
    @abstractmethod
    def get_name(cls) -> str:
        """Return agent identifier."""
        pass

    @classmethod
    @abstractmethod
    def get_source_type(cls) -> str:
        """Return the source type this agent handles."""
        pass

    @abstractmethod
    def create_graph(self) -> StateGraph:
        """Create the LangGraph state graph."""
        pass

    def get_graph(self) -> StateGraph:
        """Get compiled graph (cached)."""
        if not hasattr(self, "_graph"):
            self._graph = self.create_graph().compile()
        return self._graph

    async def run(self, input_data: dict) -> dict:
        """Run the agent on input data."""
        graph = self.get_graph()
        result = await graph.ainvoke(input_data)
        return result
