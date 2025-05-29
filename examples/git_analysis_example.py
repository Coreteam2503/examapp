"""
CrewAI MCP Integration Example - Git Server
This example demonstrates integration with the Git MCP server.
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


def git_analysis_example():
    """Example using the Git MCP server for repository analysis."""
    
    project_root = Path(__file__).parent.parent
    logger.info(f"Analyzing Git repository at: {project_root}")
    
    # Check if it's a git repository
    if not (project_root / ".git").exists():
        logger.error("This is not a Git repository. Initialize git first:")
        print("Run: git init")
        return None
    
    try:
        # Setup Git MCP Server
        logger.info("Setting up Git MCP Server...")
        
        with MCPServerAdapter(
            server_name="git",
            command="uvx",
            args=["mcp-server-git", "--repository", str(project_root)]
        ) as mcp_adapter:
            
            # Get tools from the MCP server
            git_tools = mcp_adapter.get_tools()
            logger.info(f"Loaded {len(git_tools)} git tools")
            
            # Print available tools
            print("\nAvailable Git Tools:")
            for i, tool in enumerate(git_tools, 1):
                print(f"{i}. {tool.name}: {tool.description}")
            
            # Create a Git specialist agent
            git_agent = Agent(
                role="Git Repository Analyst",
                goal="Analyze Git repositories and provide insights about version control",
                backstory="""You are an expert Git analyst who can examine repository 
                history, analyze commits, understand branching strategies, and provide 
                insights about project development patterns.""",
                tools=git_tools,
                verbose=True
            )
            
            # Create Git analysis tasks
            tasks = []
            
            # Task 1: Repository Overview
            tasks.append(Task(
                description="""Analyze the Git repository structure:
                1. Check the current branch and status
                2. List recent commits with their messages
                3. Identify all branches if any
                4. Check repository configuration""",
                expected_output="""Repository overview including:
                - Current branch name and status
                - Last 5-10 commits with authors and messages
                - Available branches
                - Basic repository statistics""",
                agent=git_agent
            ))
            
            # Task 2: Commit Analysis
            tasks.append(Task(
                description="""Perform detailed commit analysis:
                1. Analyze commit patterns and frequency
                2. Identify the most active contributors
                3. Look for any interesting commit patterns
                4. Check for merge commits vs direct commits""",
                expected_output="""Commit analysis report including:
                - Commit frequency patterns
                - Top contributors
                - Commit message quality assessment
                - Development activity insights""",
                agent=git_agent
            ))
            
            # Task 3: Code Changes Analysis
            tasks.append(Task(
                description="""Analyze recent code changes:
                1. Look at recent file modifications
                2. Identify what types of files are being changed most
                3. Check for any large changes or refactoring
                4. Analyze the scope of recent development""",
                expected_output="""Code changes analysis including:
                - Files modified recently
                - Types of changes (additions, deletions, modifications)
                - Development focus areas
                - Code evolution insights""",
                agent=git_agent
            ))
            
            # Create and run the crew
            crew = Crew(
                agents=[git_agent],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            logger.info("Running Git repository analysis...")
            result = crew.kickoff()
            
            return result
            
    except Exception as e:
        logger.error(f"Error in Git example: {e}")
        raise


def main():
    """Main entry point for Git example."""
    print("CrewAI MCP Integration - Git Repository Analysis")
    print("=" * 50)
    
    try:
        result = git_analysis_example()
        
        if result:
            print("\n" + "=" * 50)
            print("GIT ANALYSIS COMPLETED")
            print("=" * 50)
            print(result)
        
    except Exception as e:
        logger.error(f"Example failed: {e}")
        print(f"\nError: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure you have uv/uvx installed: pip install uv")
        print("2. Install git MCP server: uvx mcp-server-git --help")
        print("3. Make sure this is a Git repository: git init")
        print("4. Check your OpenAI API key in .env file")


if __name__ == "__main__":
    main()
