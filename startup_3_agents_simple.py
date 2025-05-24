#!/usr/bin/env python3
"""
Simplified 3-Agent Team - No MCP Event Loop Issues
Uses basic CrewAI tools + custom file/terminal tools
"""

import os
import sys
import subprocess
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

try:
    from crewai import Agent, Task, Crew, Process
    from crewai.tools import BaseTool
except ImportError as e:
    print(f"Missing required packages: {e}")
    sys.exit(1)

# Initialize rich console
console = Console()

class SimpleFileReadTool(BaseTool):
    name: str = "read_file"
    description: str = "Read the complete contents of a file"
    
    def _run(self, file_path: str) -> str:
        try:
            if not os.path.exists(file_path):
                return f"Error: File '{file_path}' does not exist"
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return f"Content of '{file_path}':\n\n{content}"
        except Exception as e:
            return f"Error reading file: {str(e)}"

class SimpleFileWriteTool(BaseTool):
    name: str = "write_file"
    description: str = "Write content to a file"
    
    def _run(self, file_path: str, content: str) -> str:
        try:
            # Create parent directories if needed
            parent_dir = os.path.dirname(file_path)
            if parent_dir and not os.path.exists(parent_dir):
                os.makedirs(parent_dir)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return f"✅ Successfully wrote {len(content)} characters to '{file_path}'"
        except Exception as e:
            return f"Error writing file: {str(e)}"

class SimpleExecuteCommandTool(BaseTool):
    name: str = "execute_command"
    description: str = "Execute a terminal command and return the output"
    
    def _run(self, command: str, working_directory: str = ".") -> str:
        try:
            if not command.strip():
                return "Error: No command provided"
            
            # Ensure working directory exists
            if not os.path.exists(working_directory):
                return f"Error: Working directory '{working_directory}' does not exist"
            
            # Execute command
            result = subprocess.run(
                command,
                shell=True,
                cwd=working_directory,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            output = f"Command: {command}\n"
            output += f"Working Directory: {os.path.abspath(working_directory)}\n"
            output += f"Exit Code: {result.returncode}\n\n"
            
            if result.stdout:
                output += f"STDOUT:\n{result.stdout}\n"
            
            if result.stderr:
                output += f"STDERR:\n{result.stderr}\n"
            
            if result.returncode != 0:
                output += f"\n⚠️ Command failed with exit code {result.returncode}"
            else:
                output += f"\n✅ Command executed successfully"
            
            return output
            
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after 30 seconds"
        except Exception as e:
            return f"Error executing command: {str(e)}"

class SimpleListDirectoryTool(BaseTool):
    name: str = "list_directory"
    description: str = "List contents of a directory"
    
    def _run(self, path: str = ".") -> str:
        try:
            if not os.path.exists(path):
                return f"Error: Path '{path}' does not exist"
            
            if not os.path.isdir(path):
                return f"Error: '{path}' is not a directory"
            
            items = []
            for item in os.listdir(path):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    items.append(f"📁 {item}/")
                else:
                    items.append(f"📄 {item}")
            
            output = f"Contents of '{os.path.abspath(path)}':\n\n"
            if items:
                output += "\n".join(sorted(items))
            else:
                output += "(Empty directory)"
            
            return output
            
        except Exception as e:
            return f"Error listing directory: {str(e)}"

class SimpleDevelopmentTeam:
    """Simplified 3-Agent Development Team with basic tools"""
    
    def __init__(self):
        # Load environment
        load_dotenv()
        
        # Check API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            console.print("[red]❌ OpenAI API key not configured![/red]")
            console.print("Please add your API key to .env file")
            sys.exit(1)
        
        # Create simple tools
        self.tools = [
            SimpleFileReadTool(),
            SimpleFileWriteTool(),
            SimpleExecuteCommandTool(),
            SimpleListDirectoryTool()
        ]
        
        # Initialize agents
        self.supervisor = self._create_supervisor()
        self.developer = self._create_developer()
        self.tester = self._create_tester()
        
        console.print("✅ Simplified 3-Agent Development Team initialized")
    
    def _create_supervisor(self):
        """Create the Supervisor agent"""
        return Agent(
            role="Project Supervisor",
            goal="Analyze project requirements and create detailed specifications",
            backstory="""You are an experienced project supervisor who:
            - Analyzes project requirements thoroughly
            - Creates detailed specifications for developers
            - Defines clear testing criteria
            - Plans project structure and approach
            
            Focus on high-level planning and clear documentation.""",
            tools=self.tools,
            verbose=True,
            max_iter=3,
            allow_delegation=True
        )
    
    def _create_developer(self):
        """Create the Developer agent"""
        return Agent(
            role="Software Developer",
            goal="Implement code based on supervisor specifications",
            backstory="""You are a skilled software developer who:
            - Reads and follows specifications carefully
            - Writes clean, functional code
            - Creates necessary files and structure
            - Tests your code works correctly
            - Documents your implementation process
            
            Focus purely on coding and implementation.""",
            tools=self.tools,
            verbose=True,
            max_iter=5,
            allow_delegation=False
        )
    
    def _create_tester(self):
        """Create the Tester agent"""
        return Agent(
            role="Software Tester",
            goal="Test implementations and verify they meet requirements",
            backstory="""You are a thorough software tester who:
            - Tests code implementations carefully
            - Runs various test scenarios
            - Verifies requirements are met
            - Documents test results and findings
            - Reports issues and suggestions
            
            Focus only on testing and quality assurance.""",
            tools=self.tools,
            verbose=True,
            max_iter=4,
            allow_delegation=False
        )
    
    def create_project_tasks(self, project_requirement):
        """Create workflow tasks"""
        
        # Task 1: Supervisor planning
        planning_task = Task(
            description=f"""
            Project Requirement: {project_requirement}
            
            As the Project Supervisor:
            1. Analyze the project requirement in detail
            2. Create a comprehensive project plan
            3. Define clear specifications for the developer
            4. Set testing criteria and success metrics
            5. Save your complete analysis to 'project_plan.txt'
            
            Use the write_file tool to create project_plan.txt with:
            - Project overview and goals
            - Technical specifications
            - Implementation steps
            - Testing requirements
            - Success criteria
            """,
            agent=self.supervisor,
            expected_output="Detailed project plan saved to project_plan.txt"
        )
        
        # Task 2: Developer implementation
        development_task = Task(
            description="""
            Based on the supervisor's project plan:
            1. Use read_file to read project_plan.txt carefully
            2. Implement the code according to specifications
            3. Create all necessary files and code structure
            4. Test your implementation to ensure it works
            5. Create 'development_log.txt' documenting your work
            
            Use the available tools to:
            - Read the project plan
            - Write code files
            - Execute commands to test your code
            - Document your implementation process
            """,
            agent=self.developer,
            expected_output="Working code implementation with development_log.txt"
        )
        
        # Task 3: Tester validation
        testing_task = Task(
            description="""
            Based on the project plan and developer's code:
            1. Read project_plan.txt to understand requirements
            2. Examine all code files created by developer
            3. Run comprehensive tests using execute_command
            4. Verify functionality meets all requirements
            5. Create 'test_report.txt' with detailed findings
            
            Use available tools to:
            - Read project specifications and code
            - Execute test commands
            - Validate functionality
            - Document comprehensive test results
            """,
            agent=self.tester,
            expected_output="Complete test report saved to test_report.txt"
        )
        
        return [planning_task, development_task, testing_task]
    
    def run_project(self, project_requirement):
        """Execute the project workflow"""
        
        console.print(Panel.fit(
            f"🚀 Starting Simplified Development Project\n\nRequirement: {project_requirement}",
            style="bold blue"
        ))
        
        try:
            # Create tasks
            tasks = self.create_project_tasks(project_requirement)
            
            # Create crew
            crew = Crew(
                agents=[self.supervisor, self.developer, self.tester],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            # Execute workflow
            console.print("\n📋 Executing Simplified 3-Agent Workflow...")
            console.print("   1️⃣ Supervisor: Creating detailed specifications")
            console.print("   2️⃣ Developer: Implementing code solution")
            console.print("   3️⃣ Tester: Testing and validating results")
            
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
    
    def _show_project_artifacts(self):
        """Display created files"""
        console.print("\n📁 Project Artifacts:")
        
        artifacts = ["project_plan.txt", "development_log.txt", "test_report.txt"]
        
        for artifact in artifacts:
            if os.path.exists(artifact):
                console.print(f"   ✅ {artifact}")
                try:
                    with open(artifact, 'r') as f:
                        preview = f.read()[:150]
                        console.print(f"      Preview: {preview}...", style="dim")
                except:
                    pass
            else:
                console.print(f"   ❌ {artifact} (not created)")

def main():
    """Main entry point"""
    try:
        # Get project requirement
        if len(sys.argv) > 1:
            project_requirement = ' '.join(sys.argv[1:])
        else:
            console.print("🎯 Quick Start Projects:")
            samples = [
                "Create a simple Python calculator with basic operations",
                "Build a todo list manager that saves to a text file",
                "Create a password generator with customizable length",
                "Build a file organizer that sorts files by extension",
                "Create a simple number guessing game"
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
        
        # Run the simplified development team
        team = SimpleDevelopmentTeam()
        team.run_project(project_requirement)
        
        return True
        
    except KeyboardInterrupt:
        console.print("\n👋 Interrupted by user")
        return False
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
