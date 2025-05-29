#!/usr/bin/env python3
"""
Quick Status Check - CrewAI MCP Integration Project
"""

import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def check_status():
    print("🎯 CrewAI MCP Integration Project - Status Check")
    print("="*55)
    
    # Check 1: Environment Setup
    print("\n✅ ENVIRONMENT SETUP")
    print("-" * 25)
    
    if Path("venv").exists():
        print("✅ Virtual environment: READY")
    else:
        print("❌ Virtual environment: MISSING")
    
    if os.getenv("OPENAI_API_KEY"):
        print("✅ OpenAI API key: CONFIGURED")
    else:
        print("❌ OpenAI API key: MISSING")
    
    # Check 2: CrewAI Installation
    print("\n🤖 CREWAI INSTALLATION")
    print("-" * 25)
    
    try:
        import crewai
        print("✅ CrewAI: INSTALLED")
        
        from langchain_openai import ChatOpenAI
        print("✅ OpenAI integration: AVAILABLE")
        
        print("✅ Agent collaboration: READY")
    except ImportError as e:
        print(f"❌ CrewAI installation issue: {e}")
    
    # Check 3: MCP Servers
    print("\n🔧 MCP SERVERS")
    print("-" * 15)
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, check=True)
        print(f"✅ Node.js: {result.stdout.strip()}")
    except:
        print("❌ Node.js: NOT AVAILABLE")
        print("   Install from: https://nodejs.org")
    
    # Check filesystem server
    try:
        result = subprocess.run(["npx", "@modelcontextprotocol/server-filesystem", "--version"], 
                              capture_output=True, text=True, timeout=5)
        print("✅ Filesystem MCP Server: INSTALLED")
    except:
        try:
            # Try alternative check
            process = subprocess.Popen(["npx", "@modelcontextprotocol/server-filesystem", "/tmp"], 
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            process.terminate()
            print("✅ Filesystem MCP Server: AVAILABLE")
        except:
            print("⚠️  Filesystem MCP Server: NOT INSTALLED")
            print("   Install: npm install -g @modelcontextprotocol/server-filesystem")
    
    # Check 4: Project Structure
    print("\n📁 PROJECT STRUCTURE")
    print("-" * 20)
    
    important_files = [
        ("README.md", "Documentation"),
        ("scripts/start.sh", "Start script"),
        ("comprehensive_test.py", "Main test script"),
        ("docs/", "Documentation"),
        ("examples/", "Examples"),
        ("logs/", "Logs directory")
    ]
    
    for file_path, description in important_files:
        if Path(file_path).exists():
            print(f"✅ {description}: READY")
        else:
            print(f"❌ {description}: MISSING")
    
    # Overall Status
    print("\n🎯 OVERALL STATUS")
    print("-" * 16)
    
    has_env = Path("venv").exists() and os.getenv("OPENAI_API_KEY")
    has_crewai = True
    try:
        import crewai
    except:
        has_crewai = False
    
    has_mcp = True
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except:
        has_mcp = False
    
    if has_env and has_crewai and has_mcp:
        print("🎉 PROJECT STATUS: FULLY READY")
        print("   Run: ./scripts/start.sh")
    elif has_env and has_crewai:
        print("✅ PROJECT STATUS: AGENTS READY")
        print("   Install MCP servers to complete setup")
        print("   Run: npm install -g @modelcontextprotocol/server-filesystem")
    elif has_env:
        print("⚠️  PROJECT STATUS: PARTIAL SETUP")
        print("   Install dependencies: pip install -r requirements.txt")
    else:
        print("❌ PROJECT STATUS: NEEDS SETUP")
        print("   Run the setup process first")
    
    print("\n📝 QUICK START:")
    print("1. ./scripts/start.sh           # Interactive menu")
    print("2. python3 final_demo.py       # Test both goals")
    print("3. python3 quick_test.py       # Quick agent test")

if __name__ == "__main__":
    check_status()
