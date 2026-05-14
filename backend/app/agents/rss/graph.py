from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END, START
from app.agents.base import BaseAgent, AgentState
from app.agents.registry import register_agent
from app.agents.rss.prompts import RSS_SYSTEM_PROMPT, RSS_USER_PROMPT


@register_agent
class RSSAgent(BaseAgent):
    """Agent for processing RSS feed content."""

    @classmethod
    def get_name(cls) -> str:
        return "rss_agent"

    @classmethod
    def get_source_type(cls) -> str:
        return "rss"

    def create_graph(self) -> StateGraph:
        builder = StateGraph(AgentState)

        builder.add_node("parse", self._parse_node)
        builder.add_node("process", self._process_node)
        builder.add_node("format", self._format_node)

        builder.add_edge(START, "parse")
        builder.add_edge("parse", "process")
        builder.add_edge("process", "format")
        builder.add_edge("format", END)

        return builder

    async def _parse_node(self, state: AgentState) -> dict:
        """Parse and validate raw content."""
        return {"metadata": {"parsed": True}}

    async def _process_node(self, state: AgentState) -> dict:
        """Process content with LLM."""
        from app.llm.providers import create_llm_provider

        llm_config = state.get("metadata", {}).get("llm_config", {})
        if not llm_config:
            return {"error": "No LLM configuration provided"}

        llm = create_llm_provider(
            provider_type=llm_config.get("provider", "anthropic"),
            api_key=llm_config.get("api_key", ""),
            model=llm_config.get("model", "claude-sonnet-4-20250514"),
            temperature=0.7,
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", RSS_SYSTEM_PROMPT),
            ("human", RSS_USER_PROMPT),
        ])

        metadata = state.get("metadata", {})
        chain = prompt | llm

        result = await chain.ainvoke({
            "title": metadata.get("title", ""),
            "source": metadata.get("source", ""),
            "content": state["raw_content"],
            "url": metadata.get("url", ""),
        })

        return {"processed_content": result.content}

    async def _format_node(self, state: AgentState) -> dict:
        """Format the final output."""
        return {"metadata": {"formatted": True}}
