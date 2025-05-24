#!/usr/bin/env python3
"""
Project Status and Quick Start Guide
Shows the current status and provides quick start instructions
"""

import os
import sys
from pathlib import Path

def check_project_status():
    """Check and display project status"""
    
    print("🎯 CrewAI + MCP Integration Project Status")
    print("=" * 60)
    
    # Check Python version
    version = sys.version_info
    python_ok = version.major == 3 and version.minor in [10, 11]
    status = "✅" if python_ok else "❌"
    print(f"{status} Python Version: {version.major}.{version.minor}.{version.micro}")
    
    # Check key files
    files_to_check = [
        ("requirements.txt", "Dependencies file"),
        (".env", "Environment configuration"),
        ("README.md", "Documentation"),
        ("crew_runner.py", "Main interactive runner"),
        ("setup.py", "Setup and validation script"),
        ("demo_mcp.py", "MCP tools demonstration"),
        ("servers/simple_mcp_server.py", "Working MCP server"),
        ("agents/agent_templates.py", "Agent templates"),
        ("examples/basic_example.py", "Basic usage example"),
        ("examples/advanced_example.py", "Advanced multi-agent example"),
    ]
    
    print(f"\n📁 Project Files:")
    all_files_exist = True
    for file_path, description in files_to_check:
        exists = Path(file_path).exists()
        status = "✅" if exists else "❌"
        print(f"{status} {file_path:<30} - {description}")
        if not exists:
            all_files_exist = False
    
    # Check .env configuration
    print(f"\n⚙️  Configuration Status:")
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, 'r') as f:
            env_content = f.read()
        
        has_openai_key = "OPENAI_API_KEY=" in env_content and "your_openai_api_key_here" not in env_content
        api_status = "✅ Configured" if has_openai_key else "⚠️  Placeholder (needs real API key)"
        print(f"   OpenAI API Key: {api_status}")
    else:
        print("   ❌ .env file missing")
    
    # Test MCP connection
    print(f"\n🔧 MCP Server Status:")
    try:
        from crewai_tools import MCPServerAdapter
        from mcp import StdioServerParameters
        
        server_script = Path("servers/simple_mcp_server.py")
        if server_script.exists():
            server_params = StdioServerParameters(
                command=f"python{version.major}.{version.minor}",
                args=[str(server_script)],
                env=dict(os.environ)
            )
            
            try:
                with MCPServerAdapter(server_params) as tools:
                    print(f"   ✅ MCP Server: Connected with {len(tools)} tools")
            except Exception as e:
                print(f"   ❌ MCP Server: Connection failed - {e}")
        else:
            print("   ❌ MCP Server: Script missing")
    except ImportError as e:
        print(f"   ❌ MCP Dependencies: Import failed - {e}")
    
    print(f"\n" + "=" * 60)
    
    if all_files_exist and python_ok:
        print("🎉 PROJECT SETUP COMPLETE!")
        print("\n🚀 Quick Start Options:")
        print(f"   1. Demo MCP tools:     python{version.major}.{version.minor} demo_mcp.py")
        print(f"   2. Interactive runner: python{version.major}.{version.minor} crew_runner.py")
        print(f"   3. Basic example:      python{version.major}.{version.minor} examples/basic_example.py")
        print(f"   4. Advanced example:   python{version.major}.{version.minor} examples/advanced_example.py")
        
        print("\n📝 Next Steps:")
        print("   • Add your OpenAI API key to .env file")
        print("   • Run demo_mcp.py to verify MCP tools work")
        print("   • Experiment with different agent configurations")
        print("   • Create custom MCP tools in servers/")
        
    else:
        print("⚠️  SETUP INCOMPLETE")
        print("   Run: python setup.py to fix issues")
    
    print("\n📖 Documentation: README.md")
    print("💡 Templates: agents/agent_templates.py")
    print("🔧 Tools: servers/simple_mcp_server.py")

if __name__ == "__main__":
    check_project_status()
