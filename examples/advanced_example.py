#!/usr/bin/env python3
"""
Advanced Example: Multi-Agent Collaboration
Demonstrates multiple agents working together with MCP tools
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from crewai import Agent, Task, Crew
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters
from agents.agent_templates import AgentTemplates

def main():
    # Load environment
    load_dotenv()
    
    # Setup MCP server
    server_script = Path(__file__).parent.parent / "servers" / "sample_mcp_server.py"
    server_params = StdioServerParameters(
        command="python3",
        args=[str(server_script)],
        env=dict(os.environ)
    )
    
    print("🌟 Starting Advanced Multi-Agent CrewAI + MCP Example")
    
    with MCPServerAdapter(server_params) as tools:
        print(f"✅ Connected to MCP server with {len(tools)} tools")
        
        # Create specialized agents using templates
        researcher = AgentTemplates.research_agent(tools, "technology")
        analyst = AgentTemplates.analyst_agent(tools, "market")
        writer = AgentTemplates.writer_agent(tools, "business")
        
        # Create collaborative tasks
        research_task = Task(
            description="""
            Research information about 'Python programming language popularity'.
            Use web search to gather current trends and information.
            """,
            agent=researcher,
            expected_output="Research findings about Python programming trends"
        )
        
        analysis_task = Task(
            description="""
            Based on the research findings, perform analysis:
            1. Calculate compound growth: if Python usage grows 20% annually, 
               what would be the growth over 3 years?
            2. Get current timestamp for the analysis
            3. Calculate how many developers might be using Python if there are 
               currently 10 million (use 10*1.2^3)
            """,
            agent=analyst,
            expected_output="Analysis with calculations and market projections"
        )
        
        report_task = Task(
            description="""
            Create a comprehensive business report combining:
            1. The research findings
            2. The analysis and calculations
            3. Your own insights and recommendations
            
            Save the final report to 'python_market_analysis.txt'
            """,
            agent=writer,
            expected_output="Complete market analysis report saved to file"
        )
        
        # Create crew with task dependencies
        crew = Crew(
            agents=[researcher, analyst, writer],
            tasks=[research_task, analysis_task, report_task],
            verbose=True
        )
        
        print("\n🚀 Starting multi-agent collaboration...")
        result = crew.kickoff()
        
        print(f"\n✅ Multi-agent task completed!")
        print(f"Final Result: {result}")
        
        # Check if the report file was created
        report_file = Path("python_market_analysis.txt")
        if report_file.exists():
            print(f"\n📊 Report saved successfully: {report_file}")
            print(f"File size: {report_file.stat().st_size} bytes")

if __name__ == "__main__":
    main()
