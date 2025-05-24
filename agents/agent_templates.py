#!/usr/bin/env python3
"""
Agent Templates for Easy Creation
Use these templates to quickly create new agents with different roles
"""

from crewai import Agent
from typing import List, Any

class AgentTemplates:
    """Collection of pre-configured agent templates"""
    
    @staticmethod
    def research_agent(tools: List[Any], specialized_domain: str = "general") -> Agent:
        """Create a research agent specialized in a domain"""
        return Agent(
            role=f"{specialized_domain.title()} Research Specialist",
            goal=f"Conduct thorough research in {specialized_domain} and provide comprehensive insights",
            backstory=f"""You are an expert researcher specializing in {specialized_domain}. 
            You have access to various research tools and excel at finding, analyzing, 
            and synthesizing information from multiple sources.""",
            tools=tools,
            verbose=True,
            max_iter=5,
            allow_delegation=False
        )
    
    @staticmethod
    def analyst_agent(tools: List[Any], analysis_type: str = "data") -> Agent:
        """Create an analyst agent for different types of analysis"""
        return Agent(
            role=f"{analysis_type.title()} Analyst",
            goal=f"Perform detailed {analysis_type} analysis and provide actionable insights",
            backstory=f"""You are a skilled {analysis_type} analyst with expertise in 
            processing information, identifying patterns, and generating meaningful insights. 
            You're methodical and detail-oriented.""",
            tools=tools,
            verbose=True,
            max_iter=5,
            allow_delegation=False
        )
    
    @staticmethod
    def writer_agent(tools: List[Any], writing_style: str = "technical") -> Agent:
        """Create a writer agent with specific writing style"""
        return Agent(
            role=f"{writing_style.title()} Writer",
            goal=f"Create high-quality {writing_style} content and documentation",
            backstory=f"""You are an experienced {writing_style} writer who specializes 
            in creating clear, engaging, and well-structured content. You understand 
            your audience and adapt your writing accordingly.""",
            tools=tools,
            verbose=True,
            max_iter=5,
            allow_delegation=False
        )
    
    @staticmethod
    def problem_solver_agent(tools: List[Any], domain: str = "general") -> Agent:
        """Create a problem-solving agent"""
        return Agent(
            role=f"{domain.title()} Problem Solver",
            goal=f"Analyze problems in {domain} and develop practical solutions",
            backstory=f"""You are a creative problem solver with expertise in {domain}. 
            You approach challenges systematically, consider multiple perspectives, 
            and develop innovative solutions.""",
            tools=tools,
            verbose=True,
            max_iter=5,
            allow_delegation=False
        )
    
    @staticmethod
    def coordinator_agent(tools: List[Any]) -> Agent:
        """Create a coordinator agent for managing multi-agent tasks"""
        return Agent(
            role="Project Coordinator",
            goal="Coordinate tasks between multiple agents and ensure quality outcomes",
            backstory="""You are an experienced project coordinator who excels at 
            managing complex projects with multiple stakeholders. You ensure tasks 
            are completed efficiently and to high standards.""",
            tools=tools,
            verbose=True,
            max_iter=3,
            allow_delegation=True
        )

# Example usage functions
def create_content_creation_team(tools):
    """Example: Create a team for content creation"""
    return [
        AgentTemplates.research_agent(tools, "market research"),
        AgentTemplates.analyst_agent(tools, "competitive"),
        AgentTemplates.writer_agent(tools, "marketing"),
        AgentTemplates.coordinator_agent(tools)
    ]

def create_data_analysis_team(tools):
    """Example: Create a team for data analysis"""
    return [
        AgentTemplates.research_agent(tools, "data science"),
        AgentTemplates.analyst_agent(tools, "statistical"),
        AgentTemplates.problem_solver_agent(tools, "business intelligence"),
        AgentTemplates.writer_agent(tools, "technical")
    ]

def create_research_team(tools):
    """Example: Create a team for research projects"""
    return [
        AgentTemplates.research_agent(tools, "academic"),
        AgentTemplates.research_agent(tools, "industry"),
        AgentTemplates.analyst_agent(tools, "comparative"),
        AgentTemplates.writer_agent(tools, "research report")
    ]
