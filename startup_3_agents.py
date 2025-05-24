#!/usr/bin/env python3
"""
Startup Script: 3-Agent Development Team
Supervisor -> Developer -> Tester workflow with MCP tools

Agents:
- Supervisor: Takes requirements, breaks into tasks, coordinates
- Developer: Builds code based on tasks 
- Tester: Tests the code and reports issues
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

try:
    from crewai import Agent, Task, Crew, Process
    from crewai_tools import MCPServerAdapter
    from mcp import StdioServerParameters
    from agents.agent_templates import AgentTemplates
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Run: python3.10 setup.py")
    sys.exit(1)

# Initialize rich console
console = Console()

class DevelopmentTeam:
    """3-Agent Development Team with MCP tools"""
    
    def __init__(self):
        # Load environment
        load_dotenv()
        
        # Check API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            console.print("[red]❌ OpenAI API key not configured![/red]")
            console.print("Please add your API key to .env file")
            sys.exit(1)
        
        # Setup MCP servers
        self.mcp_tools = self._setup_mcp_tools()
        
        # Initialize agents
        self.supervisor = self._create_supervisor()
        self.developer = self._create_developer() 
        self.tester = self._create_tester()
        
        console.print("✅ 3-Agent Development Team initialized with MCP tools")
    
    def _setup_mcp_tools(self):
        """Setup MCP servers and get combined tools"""
        console.print("🔧 Setting up MCP servers...")
        
        try:
            # Terminal MCP Server
            terminal_server_script = Path(__file__).parent / "servers" / "terminal_mcp_server.py"
            terminal_params = StdioServerParameters(
                command="python3.10",
                args=[str(terminal_server_script)],
                env=dict(os.environ)
            )
            
            # Filesystem MCP Server  
            filesystem_server_script = Path(__file__).parent / "servers" / "filesystem_mcp_server.py"
            filesystem_params = StdioServerParameters(
                command="python3.10", 
                args=[str(filesystem_server_script)],
                env=dict(os.environ)
            )
            
            # Simple tools server
            simple_server_script = Path(__file__).parent / "servers" / "simple_mcp_server.py"
            simple_params = StdioServerParameters(
                command="python3.10",
                args=[str(simple_server_script)],
                env=dict(os.environ)
            )
            
            # Combine all MCP tools
            all_tools = []
            
            console.print("   📡 Connecting to Terminal MCP server...")
            with MCPServerAdapter(terminal_params) as terminal_tools:
                console.print(f"   ✅ Terminal tools: {len(terminal_tools)} available")
                all_tools.extend(terminal_tools)
            
            console.print("   📁 Connecting to Filesystem MCP server...")  
            with MCPServerAdapter(filesystem_params) as filesystem_tools:
                console.print(f"   ✅ Filesystem tools: {len(filesystem_tools)} available")
                all_tools.extend(filesystem_tools)
                
            console.print("   🛠️ Connecting to Simple tools server...")
            with MCPServerAdapter(simple_params) as simple_tools:
                console.print(f"   ✅ Simple tools: {len(simple_tools)} available")
                all_tools.extend(simple_tools)
            
            console.print(f"🎯 Total MCP tools available: {len(all_tools)}")
            return all_tools
            
        except Exception as e:
            console.print(f"[red]❌ Failed to setup MCP tools: {e}[/red]")
            raise e
    
    def _create_supervisor(self):
        """Create the Supervisor agent"""
        return Agent(
            role="Project Supervisor",
            goal="Take project requirements and break them down into clear, actionable tasks for the development team",
            backstory="""You are an experienced project supervisor who specializes in:
            - Understanding project requirements and scope
            - Breaking down complex projects into manageable tasks
            - Creating clear task specifications for developers
            - Coordinating between team members
            - Making high-level architectural decisions
            
            You focus on the big picture and don't get involved in implementation details.
            You delegate specific coding tasks to developers and testing tasks to testers.
            You use time tracking and project organization tools to stay organized.""",
            tools=self.mcp_tools,
            verbose=True,
            max_iter=3,
            allow_delegation=True
        )
    
    def _create_developer(self):
        """Create the Developer agent"""
        return Agent(
            role="Software Developer", 
            goal="Implement code solutions based on task specifications from the supervisor",
            backstory="""You are a skilled software developer who specializes in:
            - Writing clean, efficient code based on specifications
            - Using terminal commands for development tasks
            - Managing files and project structure
            - Implementing features according to requirements
            - Following coding best practices
            
            You focus only on implementation and coding tasks assigned to you.
            You don't make high-level project decisions - that's the supervisor's job.
            You don't test code extensively - that's the tester's job.
            You use filesystem and terminal tools to write and manage code.""",
            tools=self.mcp_tools,
            verbose=True, 
            max_iter=5,
            allow_delegation=False
        )
    
    def _create_tester(self):
        """Create the Tester agent"""
        return Agent(
            role="Software Tester",
            goal="Test code implementations and report issues back to the team",
            backstory="""You are a meticulous software tester who specializes in:
            - Running and testing code implementations
            - Identifying bugs and issues in code
            - Verifying that code meets requirements
            - Creating test cases and scenarios
            - Running automated and manual tests
            - Documenting test results and feedback
            
            You focus only on testing and quality assurance tasks.
            You don't write production code - that's the developer's job.
            You don't make project decisions - that's the supervisor's job.
            You use terminal and filesystem tools to run tests and analyze results.""",
            tools=self.mcp_tools,
            verbose=True,
            max_iter=4,
            allow_delegation=False
        )
    
    def create_project_tasks(self, project_requirement):
        """Create the workflow tasks for the 3-agent team"""
        
        # Task 1: Supervisor breaks down the requirement
        planning_task = Task(
            description=f"""
            Project Requirement: {project_requirement}
            
            As the Project Supervisor, analyze this requirement and:
            1. Create a project plan with clear phases
            2. Break down the requirement into specific, actionable tasks
            3. Create a project structure (directories and files needed)
            4. Write a detailed specification document for the developer
            5. Define testing criteria for the tester
            
            Save your analysis to 'project_plan.txt' and create the basic project structure.
            Focus on high-level planning, not implementation details.
            """,
            agent=self.supervisor,
            expected_output="Project plan with task breakdown and project structure created"
        )
        
        # Task 2: Developer implements the code
        development_task = Task(
            description="""
            Based on the project plan and specifications created by the supervisor:
            1. Read the project_plan.txt file to understand requirements
            2. Implement the code according to specifications
            3. Create necessary files and code structure
            4. Write clean, functional code that meets the requirements
            5. Document your implementation approach
            
            Focus only on coding and implementation. Don't make architectural decisions.
            Save your implementation and create a 'development_log.txt' with your progress.
            """,
            agent=self.developer,
            expected_output="Code implementation completed with documentation"
        )
        
        # Task 3: Tester validates the implementation
        testing_task = Task(
            description="""
            Based on the project plan and the developer's implementation:
            1. Read the project_plan.txt to understand testing criteria
            2. Examine the code implementation
            3. Run tests to verify functionality
            4. Test edge cases and error conditions
            5. Create a comprehensive test report
            
            Focus only on testing and quality assurance. Don't modify the code.
            Save your findings to 'test_report.txt' with detailed results.
            """,
            agent=self.tester,
            expected_output="Comprehensive test report with results and recommendations"
        )
        
        return [planning_task, development_task, testing_task]
    
    def run_project(self, project_requirement):
        """Execute the full project workflow"""
        
        console.print(Panel.fit(
            f"🚀 Starting Development Project\n\nRequirement: {project_requirement}", 
            style="bold blue"
        ))
        
        # Create tasks
        tasks = self.create_project_tasks(project_requirement)
        
        # Create crew with sequential process
        crew = Crew(
            agents=[self.supervisor, self.developer, self.tester],
            tasks=tasks,
            process=Process.sequential,
            verbose=True
        )
        
        # Execute the workflow
        console.print("\n📋 Executing 3-Agent Development Workflow...")
        console.print("   1️⃣ Supervisor: Planning and task breakdown")
        console.print("   2️⃣ Developer: Code implementation")
        console.print("   3️⃣ Tester: Testing and validation")
        
        try:
            result = crew.kickoff()
            
            console.print(Panel.fit(
                f"✅ Project Completed!\n\nFinal Result:\n{result}", 
                style="bold green"
            ))
            
            # Show generated files
            self._show_project_artifacts()
            
            return result
            
        except Exception as e:
            console.print(f"[red]❌ Project execution failed: {e}[/red]")
            raise e
    
    def _show_project_artifacts(self):
        """Display the files created during the project"""
        console.print("\n📁 Project Artifacts Created:")
        
        artifacts = [
            "project_plan.txt",
            "development_log.txt", 
            "test_report.txt"
        ]
        
        for artifact in artifacts:
            if os.path.exists(artifact):
                console.print(f"   ✅ {artifact}")
                
                # Show first few lines
                try:
                    with open(artifact, 'r') as f:
                        lines = f.readlines()[:3]
                        preview = ''.join(lines).strip()
                        console.print(f"      Preview: {preview}...", style="dim")
                except:
                    pass
            else:
                console.print(f"   ❌ {artifact} (not created)")

def interactive_startup():
    """Interactive startup interface"""
    console.print(Panel.fit(
        "🏗️ 3-Agent Development Team\n\nSupervisor • Developer • Tester\nWith Terminal & Filesystem MCP Tools", 
        title="CrewAI Development Team", 
        style="bold cyan"
    ))
    
    # Sample project options
    sample_projects = [
        "Create a simple Python calculator with basic operations",
        "Build a todo list manager with file storage",
        "Create a basic web scraper for news headlines",
        "Build a password generator with customizable options",
        "Create a file organizer that sorts files by extension"
    ]
    
    console.print("\n🎯 Sample Project Ideas:")
    for i, project in enumerate(sample_projects, 1):
        console.print(f"   {i}. {project}")
    
    console.print("\n💡 Or describe your own project requirement...")
    
    while True:
        try:
            choice = console.input("\n[bold]Enter project number (1-5) or type custom requirement: [/bold]")
            
            if choice.strip().isdigit() and 1 <= int(choice) <= 5:
                project_requirement = sample_projects[int(choice) - 1]
                break
            elif choice.strip():
                project_requirement = choice.strip()
                break
            else:
                console.print("[red]Please enter a valid choice or requirement[/red]")
                
        except KeyboardInterrupt:
            console.print("\n👋 Goodbye!")
            sys.exit(0)
    
    # Initialize team and run project
    try:
        team = DevelopmentTeam()
        team.run_project(project_requirement)
        
    except Exception as e:
        console.print(f"[red]❌ Failed to run project: {e}[/red]")
        return False
    
    return True

def direct_startup(project_requirement):
    """Direct startup with provided requirement"""
    console.print(Panel.fit(
        f"🏗️ 3-Agent Development Team\n\nProject: {project_requirement}", 
        title="CrewAI Development Team", 
        style="bold cyan"
    ))
    
    try:
        team = DevelopmentTeam()
        team.run_project(project_requirement)
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Failed to run project: {e}[/red]")
        return False

def main():
    """Main entry point"""
    # Check if project requirement provided as argument
    if len(sys.argv) > 1:
        project_requirement = ' '.join(sys.argv[1:])
        success = direct_startup(project_requirement)
    else:
        success = interactive_startup()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
