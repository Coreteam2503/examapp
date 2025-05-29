# CrewAI MCP Integration Documentation

## Overview
The Model Context Protocol (MCP) provides a standardized way for AI agents to provide context to LLMs by communicating with external services, known as MCP Servers.

The crewai-tools library extends CrewAI's capabilities by allowing you to seamlessly integrate tools from these MCP servers into your agents.

## Key Features
- Support for Standard Input/Output (Stdio) and Server-Sent Events (SSE) transport mechanisms
- Fully managed connection lifecycle with context managers
- Integration with vast ecosystem of MCP servers

## Installation
```bash
pip install crewai-tools[mcp]
```

## Available MCP Servers (Examples)
Based on the official MCP servers repository, here are some popular servers we can use:

### Reference Servers (Official)
1. **Filesystem** - Secure file operations with configurable access controls
2. **Git** - Tools to read, search, and manipulate Git repositories  
3. **GitHub** - Repository management, file operations, and GitHub API integration
4. **Fetch** - Web content fetching and conversion for efficient LLM usage
5. **SQLite** - Database interaction and business intelligence features
6. **PostgreSQL** - Read-only database access with schema inspection

### Installation Commands
- **TypeScript servers**: Use with `npx`
- **Python servers**: Use with `uvx` (recommended) or `pip`

## MCPServerAdapter Usage

### Option 1: Fully Managed Connection (Recommended)
```python
from crewai_tools import MCPServerAdapter

# For local Stdio-based MCP server
with MCPServerAdapter(
    server_name="filesystem",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
) as mcp_adapter:
    tools = mcp_adapter.get_tools()
    # Use tools with your CrewAI agents

# For remote SSE-based MCP server  
with MCPServerAdapter(
    server_name="remote_server",
    sse_url="http://localhost:3000/sse"
) as mcp_adapter:
    tools = mcp_adapter.get_tools()
    # Use tools with your CrewAI agents
```

### Option 2: Manual Connection Management
```python
# Manual lifecycle management
mcp_server_adapter = MCPServerAdapter(
    server_name="git",
    command="uvx", 
    args=["mcp-server-git", "--repository", "/path/to/git/repo"]
)

try:
    mcp_server_adapter.start()
    tools = mcp_server_adapter.get_tools()
    # Use tools with your CrewAI agents
finally:
    mcp_server_adapter.stop()
```

## Security Considerations
- Always ensure you trust an MCP Server before using it
- For SSE transports, validate Origin headers and avoid binding to 0.0.0.0
- Implement proper authentication for SSE connections
- Be aware of DNS rebinding attack vulnerabilities

## Limitations
- Currently supports MCP tools primarily
- Other MCP primitives like prompts or resources not directly integrated 
- Output handling focuses on primary text output (.content[0].text)
- Complex or multi-modal outputs may require custom handling
