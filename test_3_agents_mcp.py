#!/usr/bin/env python3
"""
Test MCP Servers for 3-Agent Team
Verifies that terminal and filesystem MCP servers work correctly
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

try:
    from crewai_tools import MCPServerAdapter
    from mcp import StdioServerParameters
except ImportError as e:
    print(f"Missing required packages: {e}")
    sys.exit(1)

console = Console()

def test_mcp_servers():
    """Test all MCP servers for the 3-agent team"""
    
    console.print("🧪 Testing MCP Servers for 3-Agent Development Team")
    console.print("=" * 60)
    
    # Load environment
    load_dotenv()
    
    servers_to_test = [
        {
            "name": "Terminal MCP Server",
            "script": "servers/terminal_mcp_server.py",
            "expected_tools": ["execute_command", "list_directory", "check_command_exists", "get_environment_variable"]
        },
        {
            "name": "Filesystem MCP Server", 
            "script": "servers/filesystem_mcp_server.py",
            "expected_tools": ["read_file", "write_file", "create_directory", "list_files"]
        },
        {
            "name": "Simple MCP Server",
            "script": "servers/simple_mcp_server.py", 
            "expected_tools": ["get_current_time", "calculate"]
        }
    ]
    
    all_tools = []
    all_successful = True
    
    for server_info in servers_to_test:
        console.print(f"\n🔧 Testing {server_info['name']}...")
        
        server_script = Path(__file__).parent / server_info['script']
        
        if not server_script.exists():
            console.print(f"   ❌ Server script not found: {server_script}")
            all_successful = False
            continue
        
        server_params = StdioServerParameters(
            command="python3.10",
            args=[str(server_script)],
            env=dict(os.environ)
        )
        
        try:
            with MCPServerAdapter(server_params) as tools:
                console.print(f"   ✅ Connected successfully!")
                console.print(f"   📊 Tools available: {len(tools)}")
                
                # Check for expected tools
                tool_names = [tool.name for tool in tools]
                console.print(f"   🛠️ Tool names: {', '.join(tool_names)}")
                
                for expected_tool in server_info['expected_tools']:
                    if expected_tool in tool_names:
                        console.print(f"      ✅ {expected_tool}")
                    else:
                        console.print(f"      ❌ {expected_tool} (missing)")
                        all_successful = False
                
                all_tools.extend(tools)
                
        except Exception as e:
            console.print(f"   ❌ Connection failed: {e}")
            all_successful = False
    
    # Summary
    console.print(f"\n📋 Test Summary:")
    console.print(f"   Total MCP tools available: {len(all_tools)}")
    
    if all_successful:
        console.print("   ✅ All MCP servers working correctly!")
        console.print(f"\n🚀 Ready to run: python3.10 startup_3_agents.py")
    else:
        console.print("   ❌ Some MCP servers have issues")
    
    # Create tools summary table
    if all_tools:
        console.print(f"\n🛠️ Available Tools Summary:")
        table = Table(title="MCP Tools Available to Agents")
        table.add_column("Tool Name", style="cyan")
        table.add_column("Description", style="white")
        
        for tool in all_tools[:10]:  # Show first 10 tools
            table.add_row(tool.name, tool.description[:50] + "..." if len(tool.description) > 50 else tool.description)
        
        if len(all_tools) > 10:
            table.add_row("...", f"and {len(all_tools) - 10} more tools")
        
        console.print(table)
    
    return all_successful

if __name__ == "__main__":
    success = test_mcp_servers()
    sys.exit(0 if success else 1)
