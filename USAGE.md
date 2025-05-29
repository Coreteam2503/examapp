# CrewAI MCP Integration - Usage Documentation

## 🚀 Quick Start Guide

### Prerequisites Check
```bash
# Check if everything is ready
python check_status.py
```

### Launch Interactive Menu
```bash
# Start the interactive launcher
./scripts/start.sh
```

---

## 📋 Available Commands

### 1. Interactive Menu (Recommended)
```bash
./scripts/start.sh
```
**What it does:**
- Shows menu with all available tests
- Guides you through setup if needed
- Installs MCP servers automatically
- Provides interactive query interface

**Menu Options:**
1. **Quick Agent Test** - Fast 30-second collaboration demo
2. **Comprehensive Test** - Full demo with MCP integration
3. **Install MCP Servers** - Automated server installation
4. **Custom Query** - Ask your own questions to agents

### 2. Direct Test Execution

#### Main Test (Both Goals)
```bash
python comprehensive_test.py
```
**What it demonstrates:**
- 3 agents collaborating sequentially
- Real SQLite MCP server integration  
- Database analysis via MCP protocol
- Business intelligence generation
- Executive summary creation

**Expected Output:**
- Agent conversation logs
- SQL queries executed via MCP
- Business analysis results
- Executive summary report

#### Quick Agent Test
```bash
python quick_test.py
```
**What it demonstrates:**
- Basic 2-agent collaboration
- Context sharing between agents
- o3-mini model usage
- Fast execution (30 seconds)

### 3. Status and Health Checks
```bash
# Overall system status
python check_status.py

# Manual MCP server test
mcp-server-sqlite --db-path tmp/sample_company.db
```

---

## 🛠️ Configuration and Setup

### Environment Variables (.env file)
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
LOG_LEVEL=INFO
LOG_FILE=logs/crewai_mcp.log
DEBUG=True
```

### Install Additional MCP Servers
```bash
# Via interactive menu
./scripts/start.sh  # Choose option 3

# Manual installation
npm install -g @modelcontextprotocol/server-filesystem
pip install mcp-server-sqlite
```

### Python Dependencies
```bash
# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt
```

---

## 💡 Usage Examples

### Example 1: Business Analysis
```bash
python comprehensive_test.py
```
**Scenario:** Analyze company workforce and projects
**Agents Used:** Database Expert → Business Analyst → Executive Presenter
**MCP Integration:** SQLite database queries
**Output:** Executive business report

### Example 2: Custom Business Questions
```bash
./scripts/start.sh
# Choose option 4 (Custom Query)
# Enter: "What are our top performing employees by project?"
```

### Example 3: Quick Collaboration Test
```bash
python quick_test.py
```
**Scenario:** Simple AI research task
**Agents Used:** Researcher → Writer
**Focus:** Agent-to-agent communication
**Duration:** ~30 seconds

---

## 🔧 Advanced Usage

### Custom Agent Workflows

#### Creating Your Own Agents
```python
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# Configure LLM
llm = ChatOpenAI(model="o3-mini", temperature=0.3)

# Create custom agent
agent = Agent(
    role="Your Custom Role",
    goal="Your specific goal",
    backstory="Agent's background and expertise",
    llm=llm,
    tools=[],  # Add MCP tools here
    verbose=True
)
```

#### Adding MCP Tools
```python
from langchain.tools import BaseTool

class CustomMCPTool(BaseTool):
    name = "custom_tool"
    description = "What this tool does"
    
    def _run(self, query: str) -> str:
        # Your MCP server integration
        return "Tool result"

# Add to agent
agent.tools = [CustomMCPTool()]
```

### Database Operations

#### Creating Test Database
```bash
python tmp/create_sample_db.py
```

#### Custom Database Queries
```python
# In comprehensive_test.py, modify the SQL queries:
# Line ~45: Update SQLiteAnalysisTool._run() method
```

#### Using Different Databases
```bash
# PostgreSQL MCP server
pip install mcp-server-postgres
mcp-server-postgres --connection-string "postgresql://user:pass@host:5432/db"

# MySQL (if available)
# Check: https://github.com/modelcontextprotocol/servers
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. OpenAI API Errors
```bash
# Check API key
grep OPENAI_API_KEY .env

# Test API access
python -c "import openai; print('API key works')"
```

#### 2. MCP Server Issues
```bash
# Check Node.js installation
node --version  # Should be 18+

# Test SQLite server
mcp-server-sqlite --help

# Reinstall if needed
pip uninstall mcp-server-sqlite
pip install mcp-server-sqlite
```

#### 3. Agent Communication Problems
```bash
# Check verbose logs
tail -f logs/crewai_mcp.log

# Test simple collaboration
python quick_test.py
```

#### 4. Virtual Environment Issues
```bash
# Recreate environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=True
export LOG_LEVEL=DEBUG

# Run with verbose output
python comprehensive_test.py 2>&1 | tee debug.log
```

---

## 🎯 Use Cases and Applications

### Business Intelligence
- **Scenario:** Analyze company data for strategic insights
- **Command:** `python comprehensive_test.py`
- **Customization:** Modify database schema and queries

### Customer Support Analysis
- **Scenario:** Process support tickets and feedback
- **Setup:** Replace SQLite with your ticket database
- **Workflow:** Data Agent → Analysis Agent → Report Agent

### Financial Reporting
- **Scenario:** Generate financial reports from accounting data
- **MCP Server:** Connect to accounting database
- **Agents:** Financial Analyst → Risk Assessor → Report Generator

### Research and Development
- **Scenario:** Analyze research data and publications
- **Setup:** Use web scraping MCP servers
- **Workflow:** Research Agent → Analysis Agent → Summary Agent

---

## 📊 Performance and Scaling

### Optimal Performance Settings
```python
# In your agent configuration
llm = ChatOpenAI(
    model="o3-mini",        # Fastest, cost-effective
    temperature=0.1,        # More consistent results
    max_tokens=1000,        # Limit response length
    timeout=30              # Prevent hanging
)
```

### Scaling for Production
1. **Database Optimization:** Index your database tables
2. **Parallel Processing:** Use `Process.hierarchical` for independent tasks
3. **Error Handling:** Implement retry logic for MCP calls
4. **Monitoring:** Use the logging system for production monitoring

### Resource Management
```bash
# Monitor memory usage
ps aux | grep python

# Check MCP server status
ps aux | grep mcp-server

# Clean up temporary files
rm -rf tmp/
```

---

## 🔗 Integration Examples

### Slack Integration
```python
# Add Slack MCP server (when available)
# agents["slack_bot"] = Agent(
#     role="Slack Coordinator",
#     tools=[slack_mcp_tools],
#     goal="Manage Slack communications"
# )
```

### Web Scraping Integration
```bash
# Install web scraping MCP server
npm install -g @modelcontextprotocol/server-fetch

# Use in agents for web research
```

### API Integration
```python
# Custom API MCP tool
class APIMCPTool(BaseTool):
    def _run(self, endpoint: str) -> str:
        # Call your API via MCP server
        return api_response
```

---

## 📝 Best Practices

### Agent Design
1. **Clear Roles:** Give each agent a specific, focused role
2. **Detailed Backstories:** Help agents understand their expertise
3. **Appropriate Tools:** Only give agents the tools they need
4. **Reasonable Goals:** Make goals specific and achievable

### Task Orchestration
1. **Sequential for Dependencies:** Use when tasks build on each other
2. **Context Sharing:** Pass relevant task outputs as context
3. **Clear Instructions:** Be specific about expected outputs
4. **Error Handling:** Plan for task failures

### MCP Integration
1. **Test Servers First:** Verify MCP servers work independently
2. **Limit Query Scope:** Don't overload databases with huge queries
3. **Cache Results:** Store frequently used data
4. **Monitor Performance:** Track MCP server response times

---

## 🆘 Support and Resources

### Documentation
- **Project README:** `README.md`
- **API Documentation:** `docs/crewai_mcp_documentation.md`
- **Setup Guide:** `docs/setup_complete_summary.md`

### Log Files
```bash
# Application logs
tail -f logs/crewai_mcp.log

# Test results
ls logs/*.txt

# Debug information
cat logs/comprehensive_test_results.txt
```

### Getting Help
1. **Check Status:** `python check_status.py`
2. **Review Logs:** Check `logs/` directory
3. **Test Components:** Run individual tests
4. **Verify Setup:** Use interactive menu for diagnostics

### External Resources
- **CrewAI Documentation:** https://docs.crewai.com/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **MCP Servers:** https://github.com/modelcontextprotocol/servers
- **OpenAI API:** https://platform.openai.com/docs

---

## 🎉 Success Verification

### Quick Health Check
```bash
python check_status.py
# Look for: "🎉 PROJECT STATUS: FULLY READY"
```

### Full System Test
```bash
python comprehensive_test.py
# Look for: "🎉 COMPREHENSIVE TEST COMPLETED!"
```

### Individual Component Tests
```bash
# Agent collaboration only
python quick_test.py

# MCP server connectivity
mcp-server-sqlite --db-path tmp/sample_company.db
```

When all tests pass, your system is ready for production use! 🚀

---

*For additional help or custom requirements, check the examples in the `examples/` directory or modify the existing agents and tasks to suit your specific needs.*
