"""
CrewAI MCP Integration Demo - Mock Implementation
This demonstrates the integration pattern until crewai-tools[mcp] becomes available.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

# CrewAI imports
from crewai import Agent, Task, Crew, Process
from langchain.tools import BaseTool

# Load environment variables
load_dotenv()


class MockMCPTool(BaseTool):
    """Mock MCP tool to demonstrate the integration pattern."""
    
    name: str = "mock_mcp_tool"
    description: str = "A mock MCP tool for demonstration"
    
    def __init__(self, tool_name: str, tool_description: str, **kwargs):
        super().__init__(**kwargs)
        self.name = tool_name
        self.description = tool_description
    
    def _run(self, command: str = "") -> str:
        """Execute the mock MCP tool command."""
        return f"Mock MCP tool '{self.name}' executed with command: {command}"


class MockMCPServerAdapter:
    """Mock MCP Server Adapter to demonstrate the integration pattern."""
    
    def __init__(self, server_name: str, command: str = None, args: List[str] = None, sse_url: str = None):
        self.server_name = server_name
        self.command = command
        self.args = args or []
        self.sse_url = sse_url
        self.is_started = False
        
    def __enter__(self):
        self.start()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
        
    def start(self):
        """Start the MCP server connection."""
        print(f"🔗 Starting MCP server: {self.server_name}")
        if self.command:
            print(f"   Command: {self.command} {' '.join(self.args)}")
        elif self.sse_url:
            print(f"   SSE URL: {self.sse_url}")
        self.is_started = True
        
    def stop(self):
        """Stop the MCP server connection."""
        print(f"🔌 Stopping MCP server: {self.server_name}")
        self.is_started = False
        
    def get_tools(self) -> List[MockMCPTool]:
        """Get tools from the MCP server."""
        if not self.is_started:
            raise RuntimeError("MCP server not started")
            
        # Mock tools based on server type
        tools = []
        
        if self.server_name == "filesystem":
            tools = [
                MockMCPTool("read_file", "Read contents of a file"),
                MockMCPTool("write_file", "Write content to a file"),
                MockMCPTool("list_directory", "List files and directories"),
                MockMCPTool("search_files", "Search for files by pattern"),
                MockMCPTool("get_file_info", "Get file metadata and information")
            ]
        elif self.server_name == "git":
            tools = [
                MockMCPTool("git_log", "Get git commit history"),
                MockMCPTool("git_status", "Get repository status"),
                MockMCPTool("git_diff", "Show differences between commits"),
                MockMCPTool("git_branch", "List or manage branches"),
                MockMCPTool("git_show", "Show commit details")
            ]
        elif self.server_name == "fetch":
            tools = [
                MockMCPTool("fetch_url", "Fetch content from a URL"),
                MockMCPTool("fetch_html", "Fetch and parse HTML content"),
                MockMCPTool("fetch_json", "Fetch and parse JSON content"),
                MockMCPTool("fetch_text", "Fetch plain text content")
            ]
            
        print(f"📦 Loaded {len(tools)} tools from {self.server_name} MCP server")
        return tools


def demonstrate_filesystem_integration():
    """Demonstrate filesystem MCP integration pattern."""
    print("\n" + "="*60)
    print("🗂️  FILESYSTEM MCP INTEGRATION DEMO")
    print("="*60)
    
    project_root = Path(__file__).parent
    
    # Mock the MCP server setup
    with MockMCPServerAdapter(
        server_name="filesystem",
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", str(project_root)]
    ) as mcp_adapter:
        
        # Get tools
        filesystem_tools = mcp_adapter.get_tools()
        
        # Create file management agent
        file_agent = Agent(
            role="File System Analyst",
            goal="Analyze and manage project files efficiently",
            backstory="""You are a skilled file system analyst who can examine 
            project structures, read files, and provide insights about code organization.""",
            tools=filesystem_tools,
            verbose=True
        )
        
        # Create analysis task
        analysis_task = Task(
            description="""Analyze the current project:
            1. List the main directories and files
            2. Examine key configuration files
            3. Identify Python files and their purposes
            4. Provide a summary of the project structure""",
            expected_output="""A detailed project analysis including:
            - Directory structure overview
            - Configuration files found
            - Python files and their purposes
            - Overall project assessment""",
            agent=file_agent
        )
        
        # Create and run crew
        crew = Crew(
            agents=[file_agent],
            tasks=[analysis_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("\n🚀 Running filesystem analysis demo...")
        result = crew.kickoff()
        
        print("\n📋 Demo Results:")
        print("-" * 40)
        print(result)
        
        return result


def demonstrate_git_integration():
    """Demonstrate Git MCP integration pattern."""
    print("\n" + "="*60)
    print("🔀 GIT MCP INTEGRATION DEMO")
    print("="*60)
    
    project_root = Path(__file__).parent
    
    # Check if git repository exists
    if not (project_root / ".git").exists():
        print("⚠️  No git repository found. Initializing for demo...")
        try:
            subprocess.run(["git", "init"], cwd=project_root, check=True, capture_output=True)
            subprocess.run(["git", "add", "."], cwd=project_root, check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", "Initial demo commit"], 
                         cwd=project_root, check=True, capture_output=True)
            print("✅ Git repository initialized for demo")
        except subprocess.CalledProcessError:
            print("❌ Could not initialize git repository")
            return None
    
    # Mock the Git MCP server setup
    with MockMCPServerAdapter(
        server_name="git",
        command="uvx",
        args=["mcp-server-git", "--repository", str(project_root)]
    ) as mcp_adapter:
        
        # Get tools
        git_tools = mcp_adapter.get_tools()
        
        # Create Git specialist agent
        git_agent = Agent(
            role="Git Repository Analyst",
            goal="Analyze Git repositories and provide version control insights",
            backstory="""You are an expert Git analyst who can examine repository 
            history, analyze commits, and provide insights about project development.""",
            tools=git_tools,
            verbose=True
        )
        
        # Create Git analysis task
        git_task = Task(
            description="""Analyze the Git repository:
            1. Check the current branch and recent commits
            2. Analyze commit patterns and contributors
            3. Examine repository structure and history
            4. Provide development insights""",
            expected_output="""A comprehensive Git analysis including:
            - Current branch and commit status
            - Commit history overview
            - Development patterns
            - Repository health assessment""",
            agent=git_agent
        )
        
        # Create and run crew
        crew = Crew(
            agents=[git_agent],
            tasks=[git_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("\n🚀 Running Git analysis demo...")
        result = crew.kickoff()
        
        print("\n📋 Demo Results:")
        print("-" * 40)
        print(result)
        
        return result


def demonstrate_web_fetch_integration():
    """Demonstrate Web Fetch MCP integration pattern."""
    print("\n" + "="*60)
    print("🌐 WEB FETCH MCP INTEGRATION DEMO")
    print("="*60)
    
    # Mock the Fetch MCP server setup
    with MockMCPServerAdapter(
        server_name="fetch",
        command="npx",
        args=["-y", "@modelcontextprotocol/server-fetch"]
    ) as mcp_adapter:
        
        # Get tools
        fetch_tools = mcp_adapter.get_tools()
        
        # Create web research agent
        research_agent = Agent(
            role="Web Content Researcher",
            goal="Research and analyze web content for valuable insights",
            backstory="""You are an expert web researcher who can fetch content 
            from various websites and provide structured analysis and summaries.""",
            tools=fetch_tools,
            verbose=True
        )
        
        # Create research task
        research_task = Task(
            description="""Research CrewAI and MCP integration:
            1. Gather information about CrewAI MCP capabilities
            2. Understand Model Context Protocol benefits
            3. Identify best practices for integration
            4. Provide implementation recommendations""",
            expected_output="""A research summary including:
            - CrewAI MCP integration capabilities
            - Benefits of MCP protocol
            - Implementation best practices
            - Recommendations for our project""",
            agent=research_agent
        )
        
        # Create and run crew
        crew = Crew(
            agents=[research_agent],
            tasks=[research_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("\n🚀 Running web research demo...")
        result = crew.kickoff()
        
        print("\n📋 Demo Results:")
        print("-" * 40)
        print(result)
        
        return result


def demonstrate_multi_server_integration():
    """Demonstrate multi-server MCP integration pattern."""
    print("\n" + "="*60)
    print("🔗 MULTI-SERVER MCP INTEGRATION DEMO")
    print("="*60)
    
    project_root = Path(__file__).parent
    all_tools = {}
    
    # Setup multiple MCP servers
    with MockMCPServerAdapter(
        server_name="filesystem",
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", str(project_root)]
    ) as fs_adapter:
        all_tools["filesystem"] = fs_adapter.get_tools()
        
        with MockMCPServerAdapter(
            server_name="git",
            command="uvx", 
            args=["mcp-server-git", "--repository", str(project_root)]
        ) as git_adapter:
            all_tools["git"] = git_adapter.get_tools()
            
            with MockMCPServerAdapter(
                server_name="fetch",
                command="npx",
                args=["-y", "@modelcontextprotocol/server-fetch"]
            ) as fetch_adapter:
                all_tools["fetch"] = fetch_adapter.get_tools()
                
                # Create specialized agents
                agents = {}
                
                agents["file_manager"] = Agent(
                    role="File System Manager",
                    goal="Manage and analyze project files",
                    backstory="Expert in file operations and project organization",
                    tools=all_tools["filesystem"],
                    verbose=True
                )
                
                agents["git_specialist"] = Agent(
                    role="Git Specialist", 
                    goal="Handle version control analysis",
                    backstory="Expert in Git operations and repository analysis",
                    tools=all_tools["git"],
                    verbose=True
                )
                
                agents["web_researcher"] = Agent(
                    role="Web Researcher",
                    goal="Research web content and documentation",
                    backstory="Expert in web research and content analysis",
                    tools=all_tools["fetch"],
                    verbose=True
                )
                
                agents["coordinator"] = Agent(
                    role="Project Coordinator",
                    goal="Coordinate analysis and provide comprehensive insights",
                    backstory="Expert project manager who synthesizes information",
                    verbose=True
                )
                
                # Create coordinated tasks
                tasks = []
                
                tasks.append(Task(
                    description="Analyze project file structure and organization",
                    expected_output="Project structure analysis and recommendations",
                    agent=agents["file_manager"]
                ))
                
                tasks.append(Task(
                    description="Analyze git repository history and development patterns",
                    expected_output="Repository analysis and development insights",
                    agent=agents["git_specialist"]
                ))
                
                tasks.append(Task(
                    description="Research best practices for CrewAI MCP integration",
                    expected_output="Research findings and implementation guidance",
                    agent=agents["web_researcher"]
                ))
                
                tasks.append(Task(
                    description="""Synthesize all findings and create comprehensive report:
                    1. Combine insights from file, git, and web analysis
                    2. Identify strengths and improvement opportunities
                    3. Provide actionable recommendations
                    4. Create implementation roadmap""",
                    expected_output="""Comprehensive project report including:
                    - Executive summary of all findings
                    - Integrated analysis of project status
                    - Actionable improvement recommendations
                    - Implementation roadmap for enhancements""",
                    agent=agents["coordinator"]
                ))
                
                # Create and run crew
                crew = Crew(
                    agents=list(agents.values()),
                    tasks=tasks,
                    process=Process.sequential,
                    verbose=True
                )
                
                print("\n🚀 Running multi-server integration demo...")
                result = crew.kickoff()
                
                print("\n📋 Demo Results:")
                print("-" * 40)
                print(result)
                
                return result


def main():
    """Main demonstration function."""
    print("CrewAI MCP Integration Pattern Demo")
    print("🎯 This demo shows the integration patterns for MCP servers with CrewAI")
    print("📝 Note: Using mock implementation until crewai-tools[mcp] is available")
    print("\n" + "="*80)
    
    demos = [
        ("Filesystem Integration", demonstrate_filesystem_integration),
        ("Git Integration", demonstrate_git_integration), 
        ("Web Fetch Integration", demonstrate_web_fetch_integration),
        ("Multi-Server Integration", demonstrate_multi_server_integration)
    ]
    
    results = {}
    
    try:
        for demo_name, demo_func in demos:
            print(f"\n🎬 Running: {demo_name}")
            print("-" * 60)
            
            try:
                result = demo_func()
                results[demo_name] = result
                print(f"✅ {demo_name} completed successfully!")
            except Exception as e:
                print(f"❌ {demo_name} failed: {e}")
                results[demo_name] = f"Error: {e}"
            
            print("\n" + "⏸️ " * 20)
            input("Press Enter to continue to next demo...")
        
        # Save results
        results_file = Path(__file__).parent / "logs" / "demo_results.json"
        results_file.parent.mkdir(exist_ok=True)
        
        with open(results_file, "w") as f:
            json.dump({k: str(v) for k, v in results.items()}, f, indent=2)
        
        print(f"\n📁 Results saved to: {results_file}")
        
        # Final summary
        print("\n" + "="*80)
        print("🎉 DEMO COMPLETED!")
        print("="*80)
        print("📊 Summary:")
        for demo_name, result in results.items():
            status = "✅ Success" if not str(result).startswith("Error:") else "❌ Failed"
            print(f"   {demo_name}: {status}")
        
        print(f"\n📚 Next Steps:")
        print("1. Install actual MCP servers when crewai-tools[mcp] becomes available")
        print("2. Replace MockMCPServerAdapter with real MCPServerAdapter")
        print("3. Test with actual MCP server implementations")
        print("4. Customize agents and tasks for your specific use cases")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")


if __name__ == "__main__":
    main()
