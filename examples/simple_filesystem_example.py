"""
Simple CrewAI MCP Integration Example - Filesystem Server
This is a simplified example focusing on just the filesystem MCP server.
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


def simple_filesystem_example():
    """Simple example using just the filesystem MCP server."""
    
    project_root = Path(__file__).parent.parent
    logger.info(f"Working with project root: {project_root}")
    
    try:
        # Setup Filesystem MCP Server
        logger.info("Setting up Filesystem MCP Server...")
        
        with MCPServerAdapter(
            server_name="filesystem",
            command="npx",
            args=["-y", "@modelcontextprotocol/server-filesystem", str(project_root)]
        ) as mcp_adapter:
            
            # Get tools from the MCP server
            filesystem_tools = mcp_adapter.get_tools()
            logger.info(f"Loaded {len(filesystem_tools)} filesystem tools")
            
            # Print available tools
            print("\nAvailable Filesystem Tools:")
            for i, tool in enumerate(filesystem_tools, 1):
                print(f"{i}. {tool.name}: {tool.description}")
            
            # Create a file management agent
            file_agent = Agent(
                role="File System Analyst",
                goal="Analyze and manage project files efficiently",
                backstory="""You are a skilled file system analyst who can examine 
                project structures, read files, and provide insights about code organization.""",
                tools=filesystem_tools,
                verbose=True
            )
            
            # Create a simple analysis task
            analysis_task = Task(
                description="""Analyze the current project:
                1. List the main directories and files
                2. Read the README.md file if it exists
                3. Check what Python files are present
                4. Provide a summary of the project structure""",
                expected_output="""A detailed project analysis including:
                - Directory structure overview
                - Summary of key files found
                - Python files and their potential purposes
                - Overall project assessment""",
                agent=file_agent
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[file_agent],
                tasks=[analysis_task],
                process=Process.sequential,
                verbose=True
            )
            
            logger.info("Running filesystem analysis...")
            result = crew.kickoff()
            
            return result
            
    except Exception as e:
        logger.error(f"Error in filesystem example: {e}")
        raise


def main():
    """Main entry point for simple example."""
    print("CrewAI MCP Integration - Simple Filesystem Example")
    print("=" * 55)
    
    try:
        result = simple_filesystem_example()
        
        print("\n" + "=" * 55)
        print("ANALYSIS COMPLETED")
        print("=" * 55)
        print(result)
        
    except Exception as e:
        logger.error(f"Example failed: {e}")
        print(f"\nError: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure Node.js is installed (for npx)")
        print("2. Run: npm install -g @modelcontextprotocol/server-filesystem")
        print("3. Check your internet connection")
        print("4. Verify your OpenAI API key in .env file")


if __name__ == "__main__":
    main()
