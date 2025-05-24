# CrewAI + MCP Integration Project

A comprehensive setup for experimenting with CrewAI agents using Model Context Protocol (MCP) servers.

## 🚀 Quick Start

1. **Setup the project:**
   ```bash
   python setup.py
   ```

2. **Configure environment:**
   ```bash
   cp .env.template .env
   # Edit .env and add your OpenAI API key
   ```

3. **Run the main application:**
   ```bash
   python crew_runner.py
   ```

## 📁 Project Structure

```
setup_1/
├── crew_runner.py          # Main interactive runner
├── setup.py               # Automated setup script
├── requirements.txt       # Python dependencies
├── .env.template         # Environment template
├── servers/
│   └── sample_mcp_server.py  # Sample MCP server with tools
├── agents/
│   └── agent_templates.py    # Reusable agent templates
├── examples/
│   ├── basic_example.py      # Simple single-agent example
│   └── advanced_example.py   # Multi-agent collaboration
└── logs/                     # Application logs
```

## 🛠 Available Tools (MCP Server)

The sample MCP server provides these tools:

- **web_search**: Search the web for information
- **write_file**: Write content to files
- **read_file**: Read content from files  
- **calculate**: Perform mathematical calculations
- **get_current_time**: Get current date/time

## 👥 Agent Templates

Pre-configured agent templates for quick experimentation:

- **Research Agent**: Specialized in gathering information
- **Analyst Agent**: Focused on data analysis and insights
- **Writer Agent**: Creates documentation and reports
- **Problem Solver Agent**: Tackles complex challenges
- **Coordinator Agent**: Manages multi-agent tasks

## 📝 Examples

### Basic Example
```bash
python examples/basic_example.py
```
Single agent performing simple tasks with MCP tools.

### Advanced Example  
```bash
python examples/advanced_example.py
```
Multiple agents collaborating on a complex research and analysis task.

### Interactive Runner
```bash
python crew_runner.py
```
Menu-driven interface to test different scenarios.

## 🔧 Requirements

- **Python**: 3.10 or 3.11 only
- **OS**: macOS/Linux recommended, Windows with WSL
- **API Key**: OpenAI API key required

## 📦 Dependencies

Key packages installed:
- `crewai >= 0.24.0`
- `crewai-tools[mcp] >= 0.6.0` 
- `mcp >= 1.0.0`
- `pydantic == 1.10.13`
- `python-dotenv`, `loguru`, `rich`

## 🚦 Getting Started

1. **Test your setup:**
   ```bash
   python setup.py
   ```

2. **Test MCP connection:**
   ```bash
   python crew_runner.py
   # Choose option 1 to test MCP connection
   ```

3. **Run simple example:**
   ```bash
   python crew_runner.py  
   # Choose option 2 for single agent example
   ```

4. **Try multi-agent collaboration:**
   ```bash
   python crew_runner.py
   # Choose option 3 for multi-agent example
   ```

## 🎯 Creating Your Own Agents

### Method 1: Use Templates
```python
from agents.agent_templates import AgentTemplates
from crewai_tools import MCPServerAdapter

with MCPServerAdapter(server_params) as tools:
    # Create specialized agents
    researcher = AgentTemplates.research_agent(tools, "technology")
    analyst = AgentTemplates.analyst_agent(tools, "financial")
    
    # Create tasks and crew...
```

### Method 2: Custom Agents
```python
from crewai import Agent, Task, Crew

agent = Agent(
    role="Your Custom Role",
    goal="Your specific goal",
    backstory="Agent's background and expertise",
    tools=mcp_tools,
    verbose=True
)
```

## 🔍 Troubleshooting

### Common Issues:

1. **Import Errors**: Run `python setup.py` to check dependencies
2. **MCP Connection Failed**: Ensure `servers/sample_mcp_server.py` is executable
3. **API Errors**: Check your OpenAI API key in `.env` file
4. **Python Version**: Ensure you're using Python 3.10 or 3.11

### Debug Mode:
Set `DEBUG=True` in your `.env` file for verbose logging.

## 🧪 Extending the Project

### Add New MCP Tools:
Edit `servers/sample_mcp_server.py` and add new tool definitions.

### Create New Agent Types:
Add templates to `agents/agent_templates.py`.

### Add New Examples:
Create new scripts in the `examples/` directory.

## 📊 Monitoring

- Logs are saved to `logs/crewai_mcp.log`
- Use the Rich console output for real-time feedback
- Set log levels in the `.env` file

## 🤝 Contributing

This is a template project for experimentation. Feel free to:
- Add new agent templates
- Create additional MCP tools
- Improve error handling
- Add more examples

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the logs in `logs/`
3. Ensure all requirements are properly installed
4. Verify your API keys are correctly configured

---

**Happy experimenting with CrewAI and MCP! 🎉**
