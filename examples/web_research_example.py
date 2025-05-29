"""
CrewAI MCP Integration Example - Web Content Fetching
This example demonstrates integration with the Fetch MCP server for web content analysis.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# CrewAI imports
from crewai import Agent, Task, Crew, Process
from crewai_tools import MCPServerAdapter

# Load environment variables
load_dotenv()

# Configure logging
logger.remove()
logger.add(sys.stderr, level="INFO")


def web_research_example():
    """Example using the Fetch MCP server for web content research."""
    
    logger.info("Setting up web research with Fetch MCP server")
    
    try:
        # Setup Fetch MCP Server
        logger.info("Setting up Fetch MCP Server...")
        
        with MCPServerAdapter(
            server_name="fetch",
            command="npx",
            args=["-y", "@modelcontextprotocol/server-fetch"]
        ) as mcp_adapter:
            
            # Get tools from the MCP server
            fetch_tools = mcp_adapter.get_tools()
            logger.info(f"Loaded {len(fetch_tools)} fetch tools")
            
            # Print available tools
            print("\nAvailable Fetch Tools:")
            for i, tool in enumerate(fetch_tools, 1):
                print(f"{i}. {tool.name}: {tool.description}")
            
            # Create a web research agent
            researcher_agent = Agent(
                role="Web Content Researcher",
                goal="Research and analyze web content to provide valuable insights",
                backstory="""You are an expert web researcher who can fetch content 
                from various websites, analyze the information, and provide structured 
                summaries and insights. You excel at understanding web content and 
                extracting key information.""",
                tools=fetch_tools,
                verbose=True
            )
            
            # Create research tasks
            tasks = []
            
            # Task 1: CrewAI Documentation Research
            tasks.append(Task(
                description="""Research CrewAI MCP integration:
                1. Fetch content from https://docs.crewai.com/mcp/crewai-mcp-integration
                2. Extract key information about MCP integration features
                3. Identify important configuration details
                4. Summarize best practices mentioned""",
                expected_output="""CrewAI MCP integration research summary including:
                - Key features and capabilities
                - Configuration requirements
                - Best practices and recommendations
                - Important technical details""",
                agent=researcher_agent
            ))
            
            # Task 2: Model Context Protocol Overview
            tasks.append(Task(
                description="""Research Model Context Protocol basics:
                1. Fetch content from https://modelcontextprotocol.io/introduction
                2. Understand what MCP is and its purpose
                3. Identify key concepts and terminology
                4. Extract information about supported transports""",
                expected_output="""MCP overview including:
                - What is Model Context Protocol
                - Key concepts and terminology
                - Supported transport mechanisms
                - Use cases and benefits""",
                agent=researcher_agent
            ))
            
            # Task 3: MCP Servers Ecosystem
            tasks.append(Task(
                description="""Research available MCP servers:
                1. Fetch content from https://modelcontextprotocol.io/examples
                2. Identify different types of MCP servers available
                3. Understand installation and usage patterns
                4. Note any interesting or unique servers""",
                expected_output="""MCP servers ecosystem analysis including:
                - Types of MCP servers available
                - Installation methods and requirements
                - Popular servers and their capabilities
                - Recommendations for different use cases""",
                agent=researcher_agent
            ))
            
            # Task 4: Comprehensive Analysis
            tasks.append(Task(
                description="""Create a comprehensive analysis:
                1. Synthesize all the research findings
                2. Identify opportunities for our project
                3. Recommend specific MCP servers to implement
                4. Provide implementation roadmap""",
                expected_output="""Comprehensive research analysis including:
                - Executive summary of findings
                - Key opportunities identified
                - Recommended MCP servers for implementation
                - Step-by-step implementation roadmap""",
                agent=researcher_agent
            ))
            
            # Create and run the crew
            crew = Crew(
                agents=[researcher_agent],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            logger.info("Running web content research...")
            result = crew.kickoff()
            
            return result
            
    except Exception as e:
        logger.error(f"Error in web research example: {e}")
        raise


def main():
    """Main entry point for web research example."""
    print("CrewAI MCP Integration - Web Content Research")
    print("=" * 50)
    
    try:
        result = web_research_example()
        
        print("\n" + "=" * 50)
        print("WEB RESEARCH COMPLETED")
        print("=" * 50)
        print(result)
        
        # Save results to file
        project_root = Path(__file__).parent.parent
        results_file = project_root / "logs" / "web_research_results.txt"
        results_file.parent.mkdir(exist_ok=True)
        
        with open(results_file, "w") as f:
            f.write(str(result))
        
        print(f"\nResults saved to: {results_file}")
        
    except Exception as e:
        logger.error(f"Example failed: {e}")
        print(f"\nError: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure Node.js is installed (for npx)")
        print("2. Run: npm install -g @modelcontextprotocol/server-fetch")
        print("3. Check your internet connection")
        print("4. Verify your OpenAI API key in .env file")


if __name__ == "__main__":
    main()
