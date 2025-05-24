#!/usr/bin/env python3
"""
Basic Example: Single Agent with MCP Tools
Simple demonstration of CrewAI agent using MCP server tools
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

def main():
    # Load environment
    load_dotenv()
    
    # Setup MCP server
    server_script = Path(__file__).parent.parent / "servers" / "simple_mcp_server.py"
    server_params = StdioServerParameters(
        command="python3.10",
        args=[str(server_script)],
        env=dict(os.environ)
    )
    
    print("🚀 Starting Basic CrewAI + MCP Example")
    
    with MCPServerAdapter(server_params) as tools:
        print(f"✅ Connected to MCP server with {len(tools)} tools")
        
        # Create agent
        agent = Agent(
            role="Assistant",
            goal="Help with various tasks using available tools",
            backstory="You are a helpful assistant with access to tools for calculations, file operations, and web search.",
            tools=tools,
            verbose=True
        )
        
        # Create task
        task = Task(
            description="""
            1. Get the current time
            2. Calculate 15 * 24 (hours in 15 days)
            3. Write the results to a file called 'basic_example_results.txt'
            """,
            agent=agent,
            expected_output="Results saved to file with current time and calculation"
        )
        
        # Run crew
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        result = crew.kickoff()
        
        print(f"\n✅ Task completed!")
        print(f"Result: {result}")

if __name__ == "__main__":
    main()
