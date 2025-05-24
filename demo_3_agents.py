#!/usr/bin/env python3
"""
Demo Test: 3-Agent Team Setup
Shows the 3-agent team initialization without running actual agents
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

try:
    from crewai_tools import MCPServerAdapter
    from mcp import StdioServerParameters
except ImportError as e:
    print(f"Missing required packages: {e}")
    sys.exit(1)

console = Console()

def demo_3_agent_setup():
    """Demonstrate 3-agent team setup without running agents"""
    
    console.print(Panel.fit(
        "🏗️ 3-Agent Development Team Demo\n\nSupervisor • Developer • Tester\nWith Terminal & Filesystem MCP Tools", 
        title="CrewAI Development Team Demo", 
        style="bold cyan"
    ))
    
    # Load environment
    load_dotenv()
    
    # Test MCP servers setup
    console.print("\n🔧 Setting up MCP servers...")
    
    servers = [
        ("Terminal Server", "servers/terminal_mcp_server.py"),
        ("Filesystem Server", "servers/filesystem_mcp_server.py"), 
        ("Simple Tools Server", "servers/simple_mcp_server.py")
    ]
    
    all_tools = []
    
    for server_name, server_script in servers:
        console.print(f"   📡 Connecting to {server_name}...")
        
        script_path = Path(__file__).parent / server_script
        if not script_path.exists():
            console.print(f"   ❌ Script not found: {script_path}")
            continue
            
        server_params = StdioServerParameters(
            command="python3.10",
            args=[str(script_path)],
            env=dict(os.environ)
        )
        
        try:
            with MCPServerAdapter(server_params) as tools:
                console.print(f"   ✅ Connected! {len(tools)} tools available")
                all_tools.extend(tools)
        except Exception as e:
            console.print(f"   ❌ Connection failed: {e}")
    
    # Show available tools
    if all_tools:
        console.print(f"\n🛠️ Total MCP Tools Available: {len(all_tools)}")
        
        # Create tools table
        table = Table(title="MCP Tools for 3-Agent Team")
        table.add_column("Category", style="cyan")
        table.add_column("Tool Name", style="yellow")
        table.add_column("Description", style="white")
        
        # Categorize tools
        terminal_tools = [t for t in all_tools if any(x in t.name for x in ['command', 'directory', 'environment'])]
        filesystem_tools = [t for t in all_tools if any(x in t.name for x in ['file', 'create', 'copy', 'move', 'search'])]
        simple_tools = [t for t in all_tools if any(x in t.name for x in ['time', 'calculate'])]
        
        for tool in terminal_tools[:3]:
            table.add_row("Terminal", tool.name, tool.description[:40] + "...")
        
        for tool in filesystem_tools[:3]:
            table.add_row("Filesystem", tool.name, tool.description[:40] + "...")
            
        for tool in simple_tools[:2]:
            table.add_row("Simple", tool.name, tool.description[:40] + "...")
        
        console.print(table)
    
    # Show agent roles
    console.print(f"\n👥 Agent Roles:")
    
    agents_table = Table(title="3-Agent Development Team")
    agents_table.add_column("Agent", style="bold")
    agents_table.add_column("Role", style="cyan")
    agents_table.add_column("Responsibilities", style="white")
    
    agents_table.add_row(
        "👑 Supervisor",
        "Project Manager", 
        "Requirements analysis, task breakdown, planning"
    )
    agents_table.add_row(
        "💻 Developer",
        "Code Implementer",
        "Write code, create files, implement features"
    )
    agents_table.add_row(
        "🧪 Tester", 
        "Quality Assurance",
        "Test code, find bugs, validate requirements"
    )
    
    console.print(agents_table)
    
    # Show workflow
    console.print(f"\n📋 Workflow Process:")
    console.print("   1️⃣ Supervisor creates project_plan.txt")
    console.print("   2️⃣ Developer implements code based on plan")
    console.print("   3️⃣ Tester validates and creates test_report.txt")
    
    # Show sample commands
    console.print(f"\n🚀 Ready to Run:")
    console.print("   • Test setup: python3.10 test_3_agents_mcp.py")
    console.print("   • Interactive: python3.10 startup_3_agents.py") 
    console.print("   • Direct mode: python3.10 startup_3_agents.py \"your project idea\"")
    
    # API key check
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your_openai_api_key_here":
        console.print(f"\n⚠️  Next Step: Add OpenAI API key to .env file")
    else:
        console.print(f"\n✅ OpenAI API key configured - ready to run!")
    
    console.print(f"\n📖 Full documentation: 3_AGENTS_README.md")

if __name__ == "__main__":
    demo_3_agent_setup()
