#!/usr/bin/env python3
"""
CrewAI + MCP Integration Runner
Main script to demonstrate CrewAI agents using MCP server tools
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    from loguru import logger
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    
    # CrewAI imports
    from crewai import Agent, Task, Crew
    from crewai_tools import MCPServerAdapter
    from mcp import StdioServerParameters
    
except ImportError as e:
    print(f"Missing required packages. Please run: pip install -r requirements.txt")
    print(f"Error: {e}")
    sys.exit(1)

# Initialize rich console for beautiful output
console = Console()

class CrewAIMCPRunner:
    """Main class to run CrewAI with MCP integration"""
    
    def __init__(self):
        # Load environment variables
        load_dotenv()
        
        # Configure logger
        logger.add("logs/crewai_mcp.log", rotation="10 MB")
        
        # Check for API key
        if not os.getenv("OPENAI_API_KEY"):
            console.print("[red]Warning: OPENAI_API_KEY not found in environment.[/red]")
            console.print("Please copy .env.template to .env and add your API key.")
    
    def setup_mcp_server(self) -> StdioServerParameters:
        """Setup MCP server parameters"""
        server_script = Path(__file__).parent / "servers" / "sample_mcp_server.py"
        
        if not server_script.exists():
            raise FileNotFoundError(f"MCP server script not found: {server_script}")
        
        return StdioServerParameters(
            command="python3",
            args=[str(server_script)],
            env=dict(os.environ)
        )
    
    def create_research_agent(self, tools: List[Any]) -> Agent:
        """Create a research agent with MCP tools"""
        return Agent(
            role="Research Specialist",
            goal="Gather information and provide comprehensive research on given topics",
            backstory="""You are an expert researcher with access to various tools 
            including web search, file operations, and calculation capabilities. 
            You excel at finding relevant information and presenting it clearly.""",
            tools=tools,
            verbose=True,
            allow_delegation=False
        )
    
    def create_analyst_agent(self, tools: List[Any]) -> Agent:
        """Create an analyst agent with MCP tools"""
        return Agent(
            role="Data Analyst",
            goal="Analyze information and provide insights with supporting calculations",
            backstory="""You are a skilled data analyst who can process information,
            perform calculations, and create reports. You're detail-oriented and 
            provide actionable insights.""",
            tools=tools,
            verbose=True,
            allow_delegation=False
        )
    
    def create_writer_agent(self, tools: List[Any]) -> Agent:
        """Create a writer agent with MCP tools"""
        return Agent(
            role="Technical Writer",
            goal="Create well-structured documents and reports",
            backstory="""You are an experienced technical writer who specializes in
            creating clear, comprehensive reports and documentation. You can save
            your work to files and organize information effectively.""",
            tools=tools,
            verbose=True,
            allow_delegation=False
        )
    
    def run_simple_example(self):
        """Run a simple example with one agent and one task"""
        console.print(Panel.fit("🚀 Running Simple CrewAI + MCP Example", style="bold green"))
        
        try:
            # Setup MCP server
            server_params = self.setup_mcp_server()
            
            with MCPServerAdapter(server_params) as mcp_tools:
                console.print(f"✓ Connected to MCP server with {len(mcp_tools)} tools")
                
                # Display available tools
                tools_table = Table(title="Available MCP Tools")
                tools_table.add_column("Tool Name", style="cyan")
                tools_table.add_column("Description", style="white")
                
                for tool in mcp_tools:
                    tools_table.add_row(tool.name, tool.description)
                
                console.print(tools_table)
                
                # Create agent
                agent = self.create_research_agent(mcp_tools)
                
                # Create task
                task = Task(
                    description="""
                    Research the current time and then calculate how many hours are in a week.
                    Save your findings to a file called 'time_research.txt'.
                    """,
                    agent=agent,
                    expected_output="A file containing the current time and calculation results"
                )
                
                # Create and run crew
                crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    verbose=True
                )
                
                console.print("\n[bold blue]Starting CrewAI execution...[/bold blue]")
                result = crew.kickoff()
                
                console.print(Panel.fit(f"✅ Task completed!\n\nResult: {result}", style="bold green"))
                
        except Exception as e:
            logger.error(f"Error in simple example: {e}")
            console.print(f"[red]Error: {e}[/red]")
    
    def run_multi_agent_example(self):
        """Run a more complex example with multiple agents"""
        console.print(Panel.fit("🌟 Running Multi-Agent CrewAI + MCP Example", style="bold blue"))
        
        try:
            server_params = self.setup_mcp_server()
            
            with MCPServerAdapter(server_params) as mcp_tools:
                console.print(f"✓ Connected to MCP server with {len(mcp_tools)} tools")
                
                # Create multiple agents
                researcher = self.create_research_agent(mcp_tools)
                analyst = self.create_analyst_agent(mcp_tools)
                writer = self.create_writer_agent(mcp_tools)
                
                # Create tasks
                research_task = Task(
                    description="Search for information about artificial intelligence trends in 2024",
                    agent=researcher,
                    expected_output="Research findings about AI trends"
                )
                
                analysis_task = Task(
                    description="""
                    Analyze the research findings and calculate:
                    1. If AI market grows 25% annually, what would be the growth over 5 years?
                    2. Current timestamp for the analysis
                    """,
                    agent=analyst,
                    expected_output="Analysis with calculations and timestamps"
                )
                
                writing_task = Task(
                    description="""
                    Create a comprehensive report combining the research and analysis.
                    Save the final report to 'ai_trends_report.txt'.
                    """,
                    agent=writer,
                    expected_output="A complete report saved to file"
                )
                
                # Create and run crew
                crew = Crew(
                    agents=[researcher, analyst, writer],
                    tasks=[research_task, analysis_task, writing_task],
                    verbose=True
                )
                
                console.print("\n[bold blue]Starting multi-agent CrewAI execution...[/bold blue]")
                result = crew.kickoff()
                
                console.print(Panel.fit(f"✅ Multi-agent task completed!\n\nFinal Result: {result}", style="bold green"))
                
        except Exception as e:
            logger.error(f"Error in multi-agent example: {e}")
            console.print(f"[red]Error: {e}[/red]")
    
    def test_mcp_connection(self):
        """Test MCP server connection"""
        console.print(Panel.fit("🔧 Testing MCP Server Connection", style="bold yellow"))
        
        try:
            server_params = self.setup_mcp_server()
            
            with MCPServerAdapter(server_params) as mcp_tools:
                console.print(f"✅ Successfully connected to MCP server!")
                console.print(f"📊 Available tools: {len(mcp_tools)}")
                
                for i, tool in enumerate(mcp_tools, 1):
                    console.print(f"  {i}. {tool.name}: {tool.description}")
                
                return True
                
        except Exception as e:
            console.print(f"❌ MCP connection failed: {e}")
            return False

def main():
    """Main entry point"""
    runner = CrewAIMCPRunner()
    
    # Display menu
    console.print(Panel.fit("""
CrewAI + MCP Integration Testing Suite

Choose an option:
1. Test MCP Connection
2. Run Simple Example (Single Agent)
3. Run Multi-Agent Example
4. Exit
    """, title="CrewAI MCP Runner", style="bold cyan"))
    
    while True:
        try:
            choice = console.input("\n[bold]Enter your choice (1-4): [/bold]")
            
            if choice == "1":
                runner.test_mcp_connection()
            elif choice == "2":
                runner.run_simple_example()
            elif choice == "3":
                runner.run_multi_agent_example()
            elif choice == "4":
                console.print("👋 Goodbye!")
                break
            else:
                console.print("[red]Invalid choice. Please enter 1-4.[/red]")
                
        except KeyboardInterrupt:
            console.print("\n👋 Goodbye!")
            break
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")

if __name__ == "__main__":
    main()
