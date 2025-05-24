#!/usr/bin/env python3
"""
Simple MCP Connection Test
Tests the basic MCP server connection without CrewAI
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
from mcp import StdioServerParameters

def test_mcp_server():
    """Test MCP server directly"""
    
    # Load environment
    load_dotenv()
    
    # Setup MCP server with the simple server
    server_script = Path(__file__).parent / "servers" / "simple_mcp_server.py"
    server_params = StdioServerParameters(
        command="python3.10",
        args=[str(server_script)],
        env=dict(os.environ)
    )
    
    print("Testing MCP server connection...")
    print(f"Server script: {server_script}")
    print(f"Server exists: {server_script.exists()}")
    
    try:
        # Import MCPServerAdapter
        from crewai_tools import MCPServerAdapter
        
        print("✅ MCPServerAdapter imported successfully")
        
        # Test connection
        print("🔧 Testing MCP server connection...")
        with MCPServerAdapter(server_params) as tools:
            print(f"✅ Connected to MCP server!")
            print(f"📊 Available tools: {len(tools)}")
            
            for i, tool in enumerate(tools, 1):
                print(f"  {i}. {tool.name}: {tool.description}")
        
        return True
        
    except Exception as e:
        print(f"❌ MCP connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_mcp_server()
    sys.exit(0 if success else 1)
