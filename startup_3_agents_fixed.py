#!/usr/bin/env python3
"""
FIXED: 3-Agent Development Team Startup
Resolves "Event loop is closed" MCP integration issues
"""

import os
import sys
import asyncio
import threading
import time
from pathlib import Path
from contextlib import contextmanager

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

try:
    from crewai import Agent, Task, Crew, Process
    from crewai_tools import MCPServerAdapter
    from mcp import StdioServerParameters
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Run: python3.10 setup.py")
    sys.exit(1)

# Initialize rich console
console = Console()

class PersistentMCPManager:
    """Manages MCP servers with persistent connections"""
    
    def __init__(self):
        self.mcp_adapters = []
        self.all_tools = []
        self.is_initialized = False
    
    def setup_mcp_servers(self):
        """Setup MCP servers with persistent connections"""
        if self.is_initialized:
            return self.all_tools
            
        console.print("🔧 Setting up persistent MCP servers...")
        
        try:
            # Server configurations
            servers = [
                {
                    "name": "Terminal Server",
                    "script": "servers/terminal_mcp_server.py"
                },
                {
                    "name": "Filesystem Server", 
                    "script": "servers/filesystem_mcp_server.py"
                },
                {
                    "name": "Simple Tools Server",
                    "script": "servers/simple_mcp_server.py"
                }
            ]
            
            for server_info in servers:
                console.print(f"   📡 Starting {server_info['name']}...")
                
                server_script = Path(__file__).parent / server_info['script']
                if not server_script.exists():
                    console.print(f"   ❌ Script not found: {server_script}")
                    continue
                
                server_params = StdioServerParameters(
                    command="python3.10",
                    args=[str(server_script)],
                    env=dict(os.environ)
                )
                
                try:
                    # Create adapter but don't use context manager yet
                    adapter = MCPServerAdapter(server_params)
                    self.mcp_adapters.append(adapter)
                    
                    # Get tools from adapter
                    tools = adapter.tools
                    self.all_tools.extend(tools)
                    
                    console.print(f"   ✅ Connected! {len(tools)} tools available")
                    
                except Exception as e:
                    console.print(f"   ❌ Failed to connect: {e}")
                    continue
            
            console.print(f"🎯 Total MCP tools available: {len(self.all_tools)}")
            self.is_initialized = True
            return self.all_tools
            
        except Exception as e:
            console.print(f"[red]❌ Failed to setup MCP servers: {e}[/red]")
            raise e
    
    def cleanup(self):
        """Clean up MCP connections"""
        for adapter in self.mcp_adapters:
            try:
                adapter.close()
            except:
                pass
        self.mcp_adapters.clear()
        self.all_tools.clear()
        self.is_initialized = False

# Global MCP manager
mcp_manager = PersistentMCPManager()

class FixedDevelopmentTeam:
    """Fixed 3-Agent Development Team with proper MCP management"""
    
    def __init__(self):
        # Load environment
        load_dotenv()
        
        # Check API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            console.print("[red]❌ OpenAI API key not configured![/red]")
            console.print("Please add your API key to .env file")
            sys.exit(1)
        
        # Setup MCP servers with persistent connections
        self.mcp_tools = mcp_manager.setup_mcp_servers()
        
        # Initialize agents
        self.supervisor = self._create_supervisor()
        self.developer = self._create_developer() 
        self.tester = self._create_tester()
        
        console.print("✅ Fixed 3-Agent Development Team initialized")
    
    def _create_supervisor(self):
        """Create the Supervisor agent"""
        return Agent(
            role="Project Supervisor",
            goal="Take project requirements and break them down into clear, actionable tasks",
            backstory="""You are an experienced project supervisor who specializes in:
            - Understanding project requirements and scope
            - Breaking down complex projects into manageable tasks
            - Creating clear specifications for developers
            - Defining testing criteria
            - Making high-level architectural decisions
            
            You focus on planning and coordination, not implementation details.
            Use filesystem tools to create project plans and documentation.""",
            tools=self.mcp_tools,
            verbose=True,
            max_iter=3,
            allow_delegation=True
        )
    
    def _create_developer(self):
        """Create the Developer agent"""
        return Agent(
            role="Software Developer", 
            goal="Implement code solutions based on specifications from the supervisor",
            backstory="""You are a skilled software developer who specializes in:
            - Writing clean, efficient code based on specifications
            - Using terminal and filesystem tools for development
            - Creating project structure and files
            - Following coding best practices
            - Documenting implementation progress
            
            You focus only on coding and implementation.
            Use the available tools to read specifications, write code, and test functionality.""",
            tools=self.mcp_tools,
            verbose=True, 
            max_iter=5,
            allow_delegation=False
        )
    
    def _create_tester(self):
        """Create the Tester agent"""
        return Agent(
            role="Software Tester",
            goal="Test code implementations and report issues",
            backstory="""You are a meticulous software tester who specializes in:
            - Testing code implementations thoroughly
            - Using terminal tools to run tests and commands
            - Identifying bugs and issues in code
            - Verifying that code meets requirements
            - Creating comprehensive test reports
            
            You focus only on testing and quality assurance.
            Use terminal and filesystem tools to run tests and analyze results.""",
            tools=self.mcp_tools,
            verbose=True,
            max_iter=4,
            allow_delegation=False
        )
    
    def create_project_tasks(self, project_requirement):
        """Create workflow tasks with proper file handling"""
        
        # Use current working directory for better file handling
        work_dir = os.getcwd()
        
        # Task 1: Supervisor creates plan
        planning_task = Task(
            description=f"""
            Project Requirement: {project_requirement}
            Working Directory: {work_dir}
            
            As the Project Supervisor, analyze this requirement and:
            1. Create a detailed project plan
            2. Break down tasks for the developer
            3. Define testing criteria for the tester
            4. Create project structure if needed
            5. Write your analysis to 'project_plan.txt' in the current directory
            
            Focus on high-level planning and clear specifications.
            Use write_file tool to save your plan to project_plan.txt
            """,
            agent=self.supervisor,
            expected_output="Project plan saved to project_plan.txt with clear specifications"
        )
        
        # Task 2: Developer implements
        development_task = Task(
            description=f"""
            Working Directory: {work_dir}
            
            Based on the project plan created by the supervisor:
            1. Use read_file to read project_plan.txt 
            2. Implement the code according to specifications
            3. Create necessary code files
            4. Test your implementation works
            5. Create 'development_log.txt' documenting your work
            
            Focus only on implementation. Use filesystem and terminal tools as needed.
            """,
            agent=self.developer,
            expected_output="Code implementation completed with development_log.txt"
        )
        
        # Task 3: Tester validates
        testing_task = Task(
            description=f"""
            Working Directory: {work_dir}
            
            Based on the project plan and developer's implementation:
            1. Read project_plan.txt to understand requirements
            2. Examine the implemented code
            3. Run tests using terminal commands
            4. Verify functionality meets requirements
            5. Create 'test_report.txt' with your findings
            
            Focus only on testing and validation. Use available tools to run comprehensive tests.
            """,
            agent=self.tester,
            expected_output="Comprehensive test report saved to test_report.txt"
        )
        
        return [planning_task, development_task, testing_task]
    
    def run_project(self, project_requirement):
        """Execute the project workflow with proper error handling"""
        
        console.print(Panel.fit(
            f"🚀 Starting Fixed Development Project\n\nRequirement: {project_requirement}", 
            style="bold blue"
        ))
        
        try:
            # Create tasks
            tasks = self.create_project_tasks(project_requirement)
            
            # Create crew with sequential process
            crew = Crew(
                agents=[self.supervisor, self.developer, self.tester],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            # Execute workflow
            console.print("\n📋 Executing Fixed 3-Agent Workflow...")
            console.print("   1️⃣ Supervisor: Planning and specifications")
            console.print("   2️⃣ Developer: Code implementation") 
            console.print("   3️⃣ Tester: Testing and validation")
            
            result = crew.kickoff()
            
            console.print(Panel.fit(
                f"✅ Project Completed Successfully!\n\nResult: {result}", 
                style="bold green"
            ))
            
            # Show generated files
            self._show_project_artifacts()
            
            return result
            
        except Exception as e:
            console.print(f"[red]❌ Project execution failed: {e}[/red]")
            import traceback
            traceback.print_exc()
            raise e
        finally:
            # Cleanup MCP connections
            console.print("🧹 Cleaning up MCP connections...")
    
    def _show_project_artifacts(self):
        """Display created project files"""
        console.print("\n📁 Project Artifacts:")
        
        artifacts = [
            "project_plan.txt",
            "development_log.txt", 
            "test_report.txt"
        ]
        
        for artifact in artifacts:
            if os.path.exists(artifact):
                console.print(f"   ✅ {artifact}")
                try:
                    with open(artifact, 'r') as f:
                        preview = f.read()[:200]
                        console.print(f"      Preview: {preview}...", style="dim")
                except:
                    pass
            else:
                console.print(f"   ❌ {artifact} (not created)")

def main():
    """Main entry point with proper cleanup"""
    try:
        # Get project requirement
        if len(sys.argv) > 1:
            project_requirement = ' '.join(sys.argv[1:])
        else:
            console.print("🎯 Sample Projects:")
            samples = [
                "Create a simple Python calculator",
                "Build a todo list manager", 
                "Create a password generator",
                "Build a file organizer",
                "Create a simple web scraper"
            ]
            
            for i, sample in enumerate(samples, 1):
                console.print(f"   {i}. {sample}")
            
            choice = console.input("\n[bold]Enter number (1-5) or describe your project: [/bold]")
            
            if choice.strip().isdigit() and 1 <= int(choice) <= 5:
                project_requirement = samples[int(choice) - 1]
            else:
                project_requirement = choice.strip()
        
        if not project_requirement:
            console.print("[red]No project requirement provided[/red]")
            return False
        
        # Run the fixed development team
        team = FixedDevelopmentTeam()
        team.run_project(project_requirement)
        
        return True
        
    except KeyboardInterrupt:
        console.print("\n👋 Interrupted by user")
        return False
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        return False
    finally:
        # Always cleanup MCP connections
        mcp_manager.cleanup()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
