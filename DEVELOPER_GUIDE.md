# Developer Quick Start Guide - CrewAI MCP Integration

## 🎯 For Developers Who Want to Build Multi-Agent Systems

This guide helps you understand the codebase and start building your own multi-agent workflows with MCP integration.

---

## 📋 Project Overview

### What You Have
- **CrewAI**: Multi-agent framework with o3-mini model
- **MCP Integration**: Real database/file access via Model Context Protocol
- **Working Examples**: Multiple agents collaborating on business tasks

### Core Concept
```
Your Agents → MCP Tools → External Systems (DB, Files, APIs)
     ↓              ↓              ↓
  Reasoning    Protocol      Real Data
```

---

## 🚀 Quick Developer Setup

### 1. Environment Check
```bash
# Verify everything is ready
python check_status.py
# Should show: "🎉 PROJECT STATUS: FULLY READY"
```

### 2. Run Working Example
```bash
# See the system in action first
python comprehensive_test.py
# Watch 3 agents collaborate with database access
```

### 3. Study the Code
```bash
# Main example to understand
cat comprehensive_test.py
# Focus on: Agent creation, Tool assignment, Task flow
```

---

## 🔧 Development Pattern

### Basic Multi-Agent Structure
```python
# 1. Configure LLM
llm = ChatOpenAI(model="o3-mini", temperature=0.3)

# 2. Create Tools (MCP integration)
tools = [YourMCPTool(), AnotherTool()]

# 3. Create Agents with Different Roles
agent1 = Agent(role="Specialist", tools=tools, llm=llm)
agent2 = Agent(role="Analyzer", llm=llm)  # No tools needed

# 4. Create Sequential Tasks
task1 = Task(description="Do X", agent=agent1)
task2 = Task(description="Analyze results", agent=agent2, context=[task1])

# 5. Run Crew
crew = Crew(agents=[agent1, agent2], tasks=[task1, task2])
result = crew.kickoff()
```

### MCP Tool Pattern
```python
class YourMCPTool(BaseTool):
    name = "your_tool"
    description = "What this tool does"
    
    def _run(self, input_param: str) -> str:
        # Your MCP server communication here
        # Could be: database query, file read, API call
        return "Tool result"
```

---

## 🧪 Simple Development Workflow

### Step 1: Copy and Modify
```bash
# Copy working example
cp comprehensive_test.py my_test.py

# Edit agents and tasks for your use case
# Test immediately
python my_test.py
```

### Step 2: Iterate Quickly
```bash
# Change one thing at a time:
# - Agent backstories
# - Task descriptions  
# - Tool parameters
# - LLM temperature

# Test after each change
python my_test.py
```

### Step 3: Add Complexity Gradually
```bash
# Start: 2 agents, 1 MCP tool
# Then: 3 agents, 2 MCP tools  
# Finally: Complex workflows
```

---

## 📝 Development Examples

### Example 1: Simple File Processor
**Goal**: Read file → Analyze content → Write summary

```python
# Agent 1: File Reader (with MCP filesystem tools)
reader = Agent(
    role="Document Reader",
    goal="Read and extract information from files",
    backstory="Expert at parsing documents",
    tools=[FilesystemTool()]
)

# Agent 2: Content Analyzer (no tools, pure reasoning)  
analyzer = Agent(
    role="Content Analyst", 
    goal="Analyze and summarize content",
    backstory="Expert at finding patterns and insights"
)

# Task flow: Read → Analyze
```

**Test With**:
- Different file types (txt, md, json)
- Different analyzer backstories (technical vs business)
- Various file sizes

### Example 2: Database Reporter
**Goal**: Query database → Analyze data → Generate report

```python
# Agent 1: Data Analyst (with MCP database tools)
analyst = Agent(
    role="Database Analyst",
    tools=[SQLiteTool()],
    backstory="SQL expert with business acumen"
)

# Agent 2: Report Writer (no tools)
writer = Agent(
    role="Business Reporter",
    backstory="Clear communication specialist"
)
```

**Test With**:
- Different SQL queries
- Different report formats (executive vs technical)
- Various data sizes

### Example 3: Multi-Source Intelligence
**Goal**: Web research → Database lookup → Cross-reference → Report

```python
# Agent 1: Web Researcher (with fetch MCP tools)
# Agent 2: Database Analyst (with database MCP tools)  
# Agent 3: Intelligence Synthesizer (no tools)
# Agent 4: Report Generator (with file MCP tools)
```

**Test With**:
- Different research topics
- Various data sources
- Different synthesis approaches

---

## 🔍 Testing and Debugging

### Quick Testing Approach

#### 1. Single Agent Test
```python
# Test one agent in isolation
agent = Agent(role="Test", goal="Simple task", tools=[tool])
task = Task(description="Do one thing", agent=agent)
crew = Crew(agents=[agent], tasks=[task])
result = crew.kickoff()
print(result)
```

#### 2. Agent Interaction Test
```python
# Test two agents collaborating
# Focus on context passing between tasks
task2 = Task(context=[task1], ...)  # Does agent2 get agent1's output?
```

#### 3. MCP Integration Test
```python
# Test MCP tools independently
tool = YourMCPTool()
result = tool._run("test input")
print(result)  # Does the tool work?
```

### Debugging Checklist

**Agent Issues**:
- [ ] Are agent roles clear and specific?
- [ ] Do backstories match the intended behavior?
- [ ] Are tools assigned to the right agents?

**Task Issues**:
- [ ] Are task descriptions specific enough?
- [ ] Is expected_output clearly defined?
- [ ] Are task dependencies (context) correct?

**MCP Issues**:
- [ ] Does the MCP server run independently?
- [ ] Are tool parameters correct?
- [ ] Is error handling implemented?

**Collaboration Issues**:
- [ ] Are agents getting each other's outputs?
- [ ] Is the task sequence logical?
- [ ] Are agents staying in their roles?

---

## 🎨 Customization Patterns

### Agent Personality Testing
```python
# Same task, different personalities
conservative_agent = Agent(
    backstory="Risk-averse, detailed analyst"
)

aggressive_agent = Agent(
    backstory="Fast-moving, high-risk tolerance"
)

# Compare outputs for same task
```

### Tool Specialization
```python
# Some agents get tools, others don't
data_agent = Agent(tools=[DatabaseTool()])      # Can access data
logic_agent = Agent(tools=[])                   # Pure reasoning
output_agent = Agent(tools=[FileTool()])        # Can write files
```

### Dynamic Workflows
```python
# Conditional task creation based on results
if "error" in task1_result:
    error_task = Task(description="Handle error", agent=error_agent)
    tasks.append(error_task)
```

---

## 🚦 Development Best Practices

### Start Simple
1. **Single Agent**: Get one agent working perfectly
2. **Add Second**: Focus on agent collaboration
3. **Add Tools**: Integrate one MCP server at a time
4. **Scale Up**: Add complexity gradually

### Test Frequently
```bash
# After every change
python your_test.py

# Check logs for issues
tail -f logs/crewai_mcp.log
```

### Use Version Control
```bash
# Save working versions
git add your_test.py
git commit -m "Working 2-agent file processor"

# Try new ideas on branches
git checkout -b experiment-web-integration
```

### Monitor Performance
```python
import time
start_time = time.time()
result = crew.kickoff()
duration = time.time() - start_time
print(f"Execution time: {duration:.2f} seconds")
```

---

## 🎯 Common Use Cases to Try

### Business Intelligence
- Read CSV → Analyze trends → Generate dashboard
- Query database → Find insights → Create presentation

### Document Processing
- Read PDF → Extract key points → Create summary
- Process emails → Categorize → Generate responses

### Research and Analysis
- Web research → Fact checking → Create report
- Literature review → Analysis → Recommendations

### Data Pipeline
- Fetch data → Clean/transform → Store results
- Monitor APIs → Detect changes → Alert system

### Customer Support
- Read tickets → Analyze sentiment → Generate responses
- Process feedback → Identify patterns → Suggest improvements

---

## 📊 Success Metrics

### Functional Success
- [ ] Agents complete their assigned tasks
- [ ] Information flows correctly between agents
- [ ] MCP tools execute without errors
- [ ] Final output meets requirements

### Quality Success  
- [ ] Agent outputs are relevant to their roles
- [ ] Collaboration feels natural, not forced
- [ ] Results improve with agent specialization
- [ ] Error handling works gracefully

### Performance Success
- [ ] Execution time is reasonable (< 2 minutes for simple tasks)
- [ ] Memory usage is stable
- [ ] MCP servers respond quickly
- [ ] System scales with more agents/tasks

---

## 🆘 When Things Go Wrong

### Common Issues and Solutions

**"Agents not collaborating"**
- Check task context passing: `context=[previous_task]`
- Verify agent roles don't overlap
- Make task descriptions more specific

**"MCP tools not working"**
- Test MCP server independently
- Check tool parameter formatting
- Verify file/database permissions

**"Output quality poor"**
- Adjust LLM temperature (0.1-0.7 range)
- Improve agent backstories
- Make task expectations clearer

**"System too slow"**
- Reduce max_tokens in LLM config
- Limit database query results
- Use fewer agents for simple tasks

### Getting Help
```bash
# Check system status
python check_status.py

# Review logs
cat logs/crewai_mcp.log

# Test basic functionality
python quick_test.py
```

---

## 🚀 Next Steps for Developers

1. **Run the examples** to understand the patterns
2. **Copy and modify** existing code for your use case
3. **Test incrementally** - change one thing at a time
4. **Add MCP servers** as needed for external integrations
5. **Scale complexity** gradually as you understand the system

The key is starting with working code and modifying it step by step rather than building from scratch.

**Happy coding!** 🎉

---

*Need help? Check the logs in `logs/` directory or run `python check_status.py` to verify your setup.*
