#!/usr/bin/env python3
"""
Terminal MCP Server
Provides terminal command execution capabilities for CrewAI agents
"""

import asyncio
import os
import sys
import subprocess
from typing import Any, Sequence
from pathlib import Path

# MCP imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import (
        Tool,
        TextContent,
        CallToolRequest,
        CallToolResult,
    )
except ImportError:
    print("MCP packages not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)

# Initialize the MCP server
server = Server("terminal-mcp-server")

@server.list_tools()
async def list_tools() -> Sequence[Tool]:
    """List available terminal tools"""
    return [
        Tool(
            name="execute_command",
            description="Execute a terminal command and return the output",
            inputSchema={
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Terminal command to execute"
                    },
                    "working_directory": {
                        "type": "string",
                        "description": "Working directory for command execution (optional)",
                        "default": "."
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Command timeout in seconds (default: 30)",
                        "default": 30
                    }
                },
                "required": ["command"]
            }
        ),
        Tool(
            name="list_directory",
            description="List contents of a directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Directory path to list (default: current directory)",
                        "default": "."
                    },
                    "show_hidden": {
                        "type": "boolean",
                        "description": "Show hidden files and directories",
                        "default": False
                    }
                }
            }
        ),
        Tool(
            name="check_command_exists",
            description="Check if a command exists in the system PATH",
            inputSchema={
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Command name to check"
                    }
                },
                "required": ["command"]
            }
        ),
        Tool(
            name="get_environment_variable",
            description="Get the value of an environment variable",
            inputSchema={
                "type": "object",
                "properties": {
                    "variable_name": {
                        "type": "string",
                        "description": "Name of the environment variable"
                    }
                },
                "required": ["variable_name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> CallToolResult:
    """Handle tool calls"""
    
    try:
        if name == "execute_command":
            command = arguments.get("command", "")
            working_dir = arguments.get("working_directory", ".")
            timeout_seconds = arguments.get("timeout", 30)
            
            if not command.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No command provided")]
                )
            
            try:
                # Ensure working directory exists
                if not os.path.exists(working_dir):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: Working directory '{working_dir}' does not exist")]
                    )
                
                # Execute command
                result = subprocess.run(
                    command,
                    shell=True,
                    cwd=working_dir,
                    capture_output=True,
                    text=True,
                    timeout=timeout_seconds
                )
                
                output = f"Command: {command}\n"
                output += f"Working Directory: {os.path.abspath(working_dir)}\n"
                output += f"Exit Code: {result.returncode}\n\n"
                
                if result.stdout:
                    output += f"STDOUT:\n{result.stdout}\n"
                
                if result.stderr:
                    output += f"STDERR:\n{result.stderr}\n"
                
                if result.returncode != 0:
                    output += f"\n⚠️ Command failed with exit code {result.returncode}"
                else:
                    output += f"\n✅ Command executed successfully"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except subprocess.TimeoutExpired:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: Command timed out after {timeout_seconds} seconds")]
                )
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error executing command: {str(e)}")]
                )
        
        elif name == "list_directory":
            path = arguments.get("path", ".")
            show_hidden = arguments.get("show_hidden", False)
            
            try:
                if not os.path.exists(path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: Path '{path}' does not exist")]
                    )
                
                if not os.path.isdir(path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: '{path}' is not a directory")]
                    )
                
                items = []
                for item in os.listdir(path):
                    if not show_hidden and item.startswith('.'):
                        continue
                    
                    item_path = os.path.join(path, item)
                    if os.path.isdir(item_path):
                        items.append(f"📁 {item}/")
                    else:
                        items.append(f"📄 {item}")
                
                output = f"Contents of '{os.path.abspath(path)}':\n\n"
                if items:
                    output += "\n".join(sorted(items))
                else:
                    output += "(Empty directory)"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error listing directory: {str(e)}")]
                )
        
        elif name == "check_command_exists":
            command = arguments.get("command", "")
            
            if not command.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No command provided")]
                )
            
            try:
                result = subprocess.run(
                    f"which {command}",
                    shell=True,
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    output = f"✅ Command '{command}' exists at: {result.stdout.strip()}"
                else:
                    output = f"❌ Command '{command}' not found in PATH"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error checking command: {str(e)}")]
                )
        
        elif name == "get_environment_variable":
            var_name = arguments.get("variable_name", "")
            
            if not var_name.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No variable name provided")]
                )
            
            try:
                value = os.environ.get(var_name)
                if value is not None:
                    output = f"Environment variable '{var_name}': {value}"
                else:
                    output = f"Environment variable '{var_name}' is not set"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error getting environment variable: {str(e)}")]
                )
        
        else:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Error: Unknown tool '{name}'")]
            )
            
    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"Tool execution error: {str(e)}")]
        )

async def main():
    """Run the MCP server"""
    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options()
            )
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
