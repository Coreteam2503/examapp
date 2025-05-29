# CrewAI MCP Integration Examples

This project demonstrates how to integrate Model Context Protocol (MCP) servers with CrewAI agents, providing powerful capabilities for file operations, version control, web content fetching, and more.

## 🌟 Features

- **Multiple MCP Server Integration**: Filesystem, Git, and Web content fetching
- **Comprehensive Examples**: From simple single-server demos to complex multi-agent workflows
- **Production Ready**: Proper error handling, logging, and configuration management
- **Easy Setup**: Automated installation and configuration scripts

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 18+** (for NPM-based MCP servers)
- **Git** (for version control and Git MCP server)
- **OpenAI API Key** (or other compatible LLM provider)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd /Users/balajiv/Documents/coderepos/agentic_mesh/setup_1

# Run the automated setup
python setup.py
```

The setup script will:
- ✅ Check prerequisites
- ✅ Install Python dependencies
- ✅ Install MCP servers (filesystem, git, fetch)
- ✅ Test server installations
- ✅ Initialize git repository
- ✅ Create convenient run scripts

### 2. Configure Environment

Edit `.env` file and ensure your OpenAI API key is set:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run Examples

```bash
# Simple filesystem operations
python run_simple.py

# Git repository analysis
python run_git.py

# Web content research  
python run_web.py

# Full multi-server example
python run_main.py
```

## 📁 Project Structure

```
agentic_mesh/setup_1/
├── docs/                          # Documentation
│   └── crewai_mcp_documentation.md
├── src/                           # Main source code
│   └── main_example.py            # Comprehensive multi-server example
├── examples/                      # Individual examples
│   ├── simple_filesystem_example.py
│   ├── git_analysis_example.py
│   └── web_research_example.py
├── logs/                          # Log files and results
├── requirements.txt               # Python dependencies
├── setup.py                      # Automated setup script
├── .env                          # Environment configuration
└── README.md                     # This file
```

## 🔧 MCP Servers Included

### 1. Filesystem Server
- **Purpose**: Secure file and directory operations
- **Installation**: `npm install -g @modelcontextprotocol/server-filesystem`
- **Capabilities**: Read, write, list, search files and directories

### 2. Git Server  
- **Purpose**: Git repository analysis and operations
- **Installation**: `uvx install mcp-server-git`
- **Capabilities**: Repository analysis, commit history, branch management

### 3. Fetch Server
- **Purpose**: Web content fetching and analysis
- **Installation**: `npm install -g @modelcontextprotocol/server-fetch`
- **Capabilities**: Fetch web pages, extract content, analyze websites

## 📖 Examples Overview

### Simple Filesystem Example (`run_simple.py`)
A basic example demonstrating:
- Loading filesystem MCP tools
- Creating a file analysis agent
- Analyzing project structure
- Generating project insights

### Git Analysis Example (`run_git.py`)
Repository analysis example featuring:
- Git repository examination
- Commit history analysis
- Branch and contributor insights
- Development pattern recognition

### Web Research Example (`run_web.py`)
Web content research demo showing:
- Fetching documentation pages
- Analyzing MCP ecosystem
- Generating research reports
- Synthesizing web information

### Comprehensive Example (`run_main.py`)
Full-featured multi-agent system with:
- Multiple MCP servers integration
- Specialized agents for different tasks
- Coordinated workflow execution
- Comprehensive project analysis

## 🛠️ Manual Installation (Alternative)

If the automated setup doesn't work, install manually:

### Python Dependencies
```bash
pip install -r requirements.txt
```

### MCP Servers
```bash
# Filesystem server
npm install -g @modelcontextprotocol/server-filesystem

# Fetch server  
npm install -g @modelcontextprotocol/server-fetch

# Git server (requires uv)
pip install uv
uvx install mcp-server-git
```

## 🔍 Usage Patterns

### Basic MCP Integration
```python
from crewai_tools import MCPServerAdapter
from crewai import Agent, Task, Crew

# Setup MCP server
with MCPServerAdapter(
    server_name="filesystem",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"]
) as mcp_adapter:
    tools = mcp_adapter.get_tools()
    
    # Create agent with MCP tools
    agent = Agent(
        role="File Manager",
        goal="Manage files efficiently",
        tools=tools
    )
```

### Multiple Server Integration
```python
# Setup multiple servers
servers = {}
with MCPServerAdapter(...) as fs_adapter:
    servers["filesystem"] = fs_adapter.get_tools()
    
    with MCPServerAdapter(...) as git_adapter:
        servers["git"] = git_adapter.get_tools()
        
        # Create specialized agents
        file_agent = Agent(tools=servers["filesystem"], ...)
        git_agent = Agent(tools=servers["git"], ...)
```

## 🐛 Troubleshooting

### Common Issues

1. **"npx command not found"**
   - Install Node.js from https://nodejs.org
   - Verify: `node --version` and `npm --version`

2. **"uvx command not found"**
   - Install uv: `pip install uv`
   - Verify: `uvx --help`

3. **MCP Server Installation Fails**
   - Check internet connection
   - Try installing individually:
     ```bash
     npm install -g @modelcontextprotocol/server-filesystem
     npm install -g @modelcontextprotocol/server-fetch
     uvx install mcp-server-git
     ```

4. **OpenAI API Errors**
   - Verify API key in `.env` file
   - Check API key permissions and billing

5. **Git Server Issues**
   - Ensure the directory is a git repository: `git init`
   - Check repository permissions

### Debugging

Enable detailed logging by setting in `.env`:
```bash
LOG_LEVEL=DEBUG
```

Check logs in:
- Console output (immediate feedback)
- `logs/crewai_mcp.log` (detailed logging)
- `logs/crew_results.txt` (execution results)

## 📚 Documentation

- **CrewAI MCP Integration**: [docs/crewai_mcp_documentation.md](docs/crewai_mcp_documentation.md)
- **Official CrewAI Docs**: https://docs.crewai.com/mcp/crewai-mcp-integration
- **Model Context Protocol**: https://modelcontextprotocol.io/introduction
- **MCP Servers Repository**: https://github.com/modelcontextprotocol/servers

## 🔐 Security Considerations

- **Trust MCP Servers**: Only use MCP servers from trusted sources
- **File Permissions**: Filesystem server respects directory restrictions
- **API Keys**: Keep API keys secure and don't commit to version control
- **Network Access**: Fetch server can access any URL (use responsibly)

## 🚀 Next Steps

1. **Experiment with Examples**: Run all provided examples to understand capabilities
2. **Customize Agents**: Modify agent roles and goals for your specific use cases
3. **Add More Servers**: Explore additional MCP servers from the ecosystem
4. **Build Your Application**: Use this as a foundation for your own projects

## 🤝 Contributing

This project serves as a reference implementation. Feel free to:
- Report issues or bugs
- Suggest improvements
- Add new MCP server integrations
- Share your use cases

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Anthropic** for the Model Context Protocol specification
- **CrewAI Team** for the excellent MCP integration
- **MCP Community** for the diverse server ecosystem
