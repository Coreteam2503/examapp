#!/bin/bash

# CrewAI MCP Integration - Start Script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 CrewAI MCP Integration Startup${NC}"
echo -e "${BLUE}===============================${NC}"
echo "Project Directory: $PROJECT_DIR"

# Check virtual environment
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo -e "${RED}❌ Virtual environment not found.${NC}"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo -e "${BLUE}📦 Activating virtual environment...${NC}"
source "$PROJECT_DIR/venv/bin/activate"
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Check .env file
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check OpenAI API key
if ! grep -q "OPENAI_API_KEY=" "$PROJECT_DIR/.env"; then
    echo -e "${RED}❌ OPENAI_API_KEY not found in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration verified${NC}"

# Change to project directory
cd "$PROJECT_DIR"

# Menu function
show_menu() {
    echo -e "\n${BLUE}📋 Available Tests:${NC}"
    echo "1. Quick Agent Collaboration Test (Recommended)"
    echo "2. Comprehensive Test - Both Goals (NEW)"
    echo "3. Install MCP Servers"
    echo "4. Custom Query (Interactive)"
    echo "0. Exit"
    echo
    read -p "Select test (0-4): " choice
}

# Run custom query
run_custom_query() {
    echo -e "\n${BLUE}🎯 Custom Query Test${NC}"
    echo "Enter your question for the AI agents to collaborate on:"
    read -p "> " user_query
    
    if [ -z "$user_query" ]; then
        user_query="What are the benefits of multi-agent AI systems?"
    fi
    
    echo -e "\n${YELLOW}Processing: \"$user_query\"${NC}"
    
    cat > custom_test.py << EOF
import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

load_dotenv()

llm = ChatOpenAI(model="o3-mini", temperature=0.7)

researcher = Agent(
    role="Research Specialist",
    goal="Research and analyze the given query thoroughly",
    backstory="You are an expert researcher with deep analytical skills.",
    llm=llm, verbose=True
)

advisor = Agent(
    role="Strategic Advisor",
    goal="Provide practical advice based on research findings",
    backstory="You are an experienced advisor who provides actionable insights.",
    llm=llm, verbose=True
)

research_task = Task(
    description=f"Research this question thoroughly: {user_query}",
    expected_output="Comprehensive research findings with key insights",
    agent=researcher
)

advice_task = Task(
    description="Based on the research, provide practical advice and recommendations",
    expected_output="Actionable advice and recommendations",
    agent=advisor,
    context=[research_task]
)

crew = Crew(
    agents=[researcher, advisor],
    tasks=[research_task, advice_task],
    process=Process.sequential,
    verbose=True
)

result = crew.kickoff()
print("\n" + "="*60)
print("🎉 COLLABORATION COMPLETE!")
print("="*60)
print(result)
EOF
    
    python3 custom_test.py
    rm custom_test.py
}

# Install MCP servers
install_mcp_servers() {
    echo -e "\n${BLUE}📦 Installing MCP Servers${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
    
    # Install filesystem server
    echo "Installing filesystem server..."
    if npm install -g @modelcontextprotocol/server-filesystem 2>/dev/null; then
        echo -e "${GREEN}✅ Filesystem server installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Filesystem server installation had issues${NC}"
    fi
    
    # Install fetch server
    echo "Installing fetch server..."
    if npm install -g @modelcontextprotocol/server-fetch 2>/dev/null; then
        echo -e "${GREEN}✅ Fetch server installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Fetch server installation had issues${NC}"
    fi
    
    # Install SQLite MCP server
    echo "Installing SQLite MCP server..."
    if pip install mcp-server-sqlite 2>/dev/null; then
        echo -e "${GREEN}✅ SQLite MCP server installed${NC}"
    else
        echo -e "${YELLOW}⚠️  SQLite MCP server installation had issues${NC}"
    fi
    
    echo -e "\n${GREEN}✅ MCP server installation completed${NC}"
    echo "Test the servers with option 2 (Final Demo)"
}

# Main menu loop
main() {
    while true; do
        show_menu
        
        case $choice in
            1)
                echo -e "\n${BLUE}🚀 Quick Agent Collaboration Test${NC}"
                echo -e "${BLUE}=================================${NC}"
                python3 quick_test.py
                ;;
            2)
                echo -e "\n${BLUE}🎯 Comprehensive Test - Both Goals${NC}"
                echo -e "${BLUE}==================================${NC}"
                python3 comprehensive_test.py
                ;;
            3)
                install_mcp_servers
                ;;
            4)
                run_custom_query
                ;;
            0)
                echo -e "\n${GREEN}👋 Goodbye!${NC}"
                break
                ;;
            *)
                echo -e "${YELLOW}⚠️  Invalid choice. Please select 0-4.${NC}"
                ;;
        esac
        
        echo -e "\n${YELLOW}Press Enter to continue...${NC}"
        read
    done
}

# Check dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi

if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js not found - MCP servers won't work${NC}"
fi

echo -e "${GREEN}✅ Dependency check completed${NC}"

# Start main menu
main
