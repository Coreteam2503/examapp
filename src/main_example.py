"""
CrewAI with MCP Server Integration - Main Example
This example demonstrates how to integrate multiple MCP servers with CrewAI agents.
"""

import os
import sys
from pathlib import Path
from typing import List
import asyncio
from dotenv import load_dotenv
from loguru import logger

# CrewAI imports
from crewai import Agent, Task, Crew, Process
from crewai_tools import MCPServerAdapter

# Load environment variables
load_dotenv()

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)
logger.add(
    os.getenv("LOG_FILE", "logs/crewai_mcp.log"),
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    rotation="10 MB"
)

class CrewAIMCPIntegration:
    """Main class for CrewAI MCP integration example."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.mcp_tools = {}
        self.agents = {}
        self.tasks = []
        
    def setup_mcp_servers(self) -> dict:
        """Set up multiple MCP servers and return their tools."""
        tools = {}
        
        try:
            # 1. Filesystem MCP Server
            logger.info("Setting up Filesystem MCP Server...")
            with MCPServerAdapter(
                server_name="filesystem",
                command="npx",
                args=["-y", "@modelcontextprotocol/server-filesystem", str(self.project_root)]
            ) as fs_adapter:
                tools["filesystem"] = fs_adapter.get_tools()
                logger.success(f"Filesystem tools loaded: {len(tools['filesystem'])} tools")
                
        except Exception as e:
            logger.error(f"Failed to load Filesystem MCP server: {e}")
            tools["filesystem"] = []
            
        try:
            # 2. Git MCP Server (if git repo exists)
            git_dir = self.project_root / ".git"
            if git_dir.exists():
                logger.info("Setting up Git MCP Server...")
                with MCPServerAdapter(
                    server_name="git",
                    command="uvx",
                    args=["mcp-server-git", "--repository", str(self.project_root)]
                ) as git_adapter:
                    tools["git"] = git_adapter.get_tools()
                    logger.success(f"Git tools loaded: {len(tools['git'])} tools")
            else:
                logger.warning("No git repository found, skipping Git MCP server")
                tools["git"] = []
                
        except Exception as e:
            logger.error(f"Failed to load Git MCP server: {e}")
            tools["git"] = []
            
        try:
            # 3. Fetch MCP Server (for web content)
            logger.info("Setting up Fetch MCP Server...")
            with MCPServerAdapter(
                server_name="fetch",
                command="npx",
                args=["-y", "@modelcontextprotocol/server-fetch"]
            ) as fetch_adapter:
                tools["fetch"] = fetch_adapter.get_tools()
                logger.success(f"Fetch tools loaded: {len(tools['fetch'])} tools")
                
        except Exception as e:
            logger.error(f"Failed to load Fetch MCP server: {e}")
            tools["fetch"] = []
        
        return tools
    
    def create_agents(self, tools: dict) -> dict:
        """Create specialized agents with MCP tools."""
        agents = {}
        
        # File System Agent
        file_tools = tools.get("filesystem", [])
        agents["file_manager"] = Agent(
            role="File System Manager",
            goal="Manage files and directories efficiently and securely",
            backstory="""You are an expert file system manager with deep knowledge of 
            file operations, directory structures, and data organization. You help with
            reading, writing, organizing, and analyzing files and folders.""",
            tools=file_tools,
            verbose=True,
            allow_delegation=False
        )
        
        # Git Operations Agent  
        git_tools = tools.get("git", [])
        agents["git_specialist"] = Agent(
            role="Git Operations Specialist", 
            goal="Handle all git repository operations and version control tasks",
            backstory="""You are a version control expert specializing in Git operations.
            You can analyze repositories, manage branches, commits, and provide insights
            about code changes and project history.""",
            tools=git_tools,
            verbose=True,
            allow_delegation=False
        )
        
        # Web Content Agent
        fetch_tools = tools.get("fetch", [])
        agents["web_researcher"] = Agent(
            role="Web Content Researcher",
            goal="Fetch and analyze web content for research and analysis tasks",
            backstory="""You are a skilled web researcher who can fetch, analyze, and 
            summarize content from various web sources. You excel at gathering information
            from URLs and providing structured analysis.""",
            tools=fetch_tools,
            verbose=True,
            allow_delegation=False
        )
        
        # Coordinator Agent (no MCP tools, just orchestration)
        agents["coordinator"] = Agent(
            role="Project Coordinator",
            goal="Coordinate tasks between different specialists and provide overall project management",
            backstory="""You are an experienced project coordinator who manages complex
            projects by delegating tasks to specialists and ensuring all work is completed
            efficiently and accurately.""",
            verbose=True,
            allow_delegation=True
        )
        
        return agents
    
    def create_sample_tasks(self, agents: dict) -> List[Task]:
        """Create sample tasks that demonstrate MCP integration."""
        tasks = []
        
        # Task 1: Project Analysis
        tasks.append(Task(
            description="""Analyze the current project structure:
            1. List all files and directories in the project
            2. Identify the main components and their purposes
            3. Check if there are any configuration files
            4. Provide insights about the project organization""",
            expected_output="""A comprehensive report about the project structure including:
            - Directory tree overview
            - Key files and their purposes
            - Configuration files found
            - Recommendations for organization""",
            agent=agents["file_manager"]
        ))
        
        # Task 2: Git Analysis (if git tools are available)
        if agents["git_specialist"].tools:
            tasks.append(Task(
                description="""Analyze the git repository:
                1. Check the current branch and recent commits
                2. Analyze the commit history and patterns
                3. Identify contributors and their contributions
                4. Check for any pending changes or branches""",
                expected_output="""A detailed git repository analysis including:
                - Current branch status
                - Recent commit summary
                - Contributor analysis
                - Repository health assessment""",
                agent=agents["git_specialist"]
            ))
        
        # Task 3: Web Research Task
        tasks.append(Task(
            description="""Research the latest information about CrewAI and MCP integration:
            1. Fetch content from https://docs.crewai.com/mcp/crewai-mcp-integration
            2. Summarize the key features and capabilities
            3. Identify best practices mentioned in the documentation
            4. Compare with our current implementation""",
            expected_output="""A research summary including:
            - Key features of CrewAI MCP integration
            - Best practices and recommendations
            - Comparison with current implementation
            - Suggestions for improvements""",
            agent=agents["web_researcher"]
        ))
        
        # Task 4: Final Coordination Task
        tasks.append(Task(
            description="""Coordinate all findings and create a comprehensive project report:
            1. Collect insights from all specialists
            2. Synthesize the information into a coherent overview
            3. Identify areas for improvement
            4. Provide actionable recommendations""",
            expected_output="""A comprehensive project report including:
            - Executive summary of all findings
            - Project status overview
            - Areas for improvement
            - Actionable recommendations for next steps""",
            agent=agents["coordinator"],
            context=tasks  # This task depends on all previous tasks
        ))
        
        return tasks
    
    def run_example(self):
        """Run the complete CrewAI MCP integration example."""
        logger.info("Starting CrewAI MCP Integration Example")
        
        try:
            # Setup MCP servers
            logger.info("Setting up MCP servers...")
            self.mcp_tools = self.setup_mcp_servers()
            
            # Create agents with MCP tools
            logger.info("Creating agents...")
            self.agents = self.create_agents(self.mcp_tools)
            
            # Create tasks
            logger.info("Creating tasks...")
            self.tasks = self.create_sample_tasks(self.agents)
            
            # Create and run crew
            logger.info("Creating crew...")
            crew = Crew(
                agents=list(self.agents.values()),
                tasks=self.tasks,
                process=Process.sequential,
                verbose=True,
                memory=True,
                planning=True
            )
            
            logger.info("Starting crew execution...")
            result = crew.kickoff()
            
            logger.success("Crew execution completed!")
            
            # Save results
            results_file = self.project_root / "logs" / "crew_results.txt"
            with open(results_file, "w") as f:
                f.write(str(result))
            
            logger.info(f"Results saved to: {results_file}")
            return result
            
        except Exception as e:
            logger.error(f"Error running example: {e}")
            raise


def main():
    """Main entry point."""
    try:
        # Initialize the integration
        integration = CrewAIMCPIntegration()
        
        # Run the example
        result = integration.run_example()
        
        print("\n" + "="*80)
        print("CREWAI MCP INTEGRATION EXAMPLE COMPLETED")
        print("="*80)
        print(f"Final Result:")
        print(result)
        
    except KeyboardInterrupt:
        logger.warning("Example interrupted by user")
    except Exception as e:
        logger.error(f"Example failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
