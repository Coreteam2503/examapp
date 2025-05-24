#!/usr/bin/env python3
"""
Simple MCP Server for CrewAI Integration
Provides basic tools for file operations, calculations, and time
"""

import asyncio
import os
import sys
from datetime import datetime
from typing import Any, Sequence

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
server = Server("simple-tools-server")

@server.list_tools()
async def list_tools() -> Sequence[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_current_time",
            description="Get the current date and time",
            inputSchema={
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string",
                        "description": "Time format (default: '%Y-%m-%d %H:%M:%S')",
                        "default": "%Y-%m-%d %H:%M:%S"
                    }
                }
            }
        ),
        Tool(
            name="calculate",
            description="Perform mathematical calculations",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate (e.g., '2+2', '10*5', 'sqrt(16)')"
                    }
                },
                "required": ["expression"]
            }
        ),
        Tool(
            name="write_file",
            description="Write content to a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the file to write"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to the file"
                    }
                },
                "required": ["filename", "content"]
            }
        ),
        Tool(
            name="read_file",
            description="Read content from a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the file to read"
                    }
                },
                "required": ["filename"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> CallToolResult:
    """Handle tool calls"""
    
    try:
        if name == "get_current_time":
            time_format = arguments.get("format", "%Y-%m-%d %H:%M:%S")
            current_time = datetime.now().strftime(time_format)
            return CallToolResult(
                content=[TextContent(type="text", text=f"Current time: {current_time}")]
            )
        
        elif name == "calculate":
            expression = arguments.get("expression", "")
            if not expression:
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No expression provided")]
                )
            
            # Safe mathematical evaluation
            import math
            
            # Allow only safe mathematical operations
            allowed_names = {
                k: v for k, v in math.__dict__.items() if not k.startswith("__")
            }
            allowed_names.update({"abs": abs, "round": round})
            
            try:
                result = eval(expression, {"__builtins__": {}}, allowed_names)
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Result: {expression} = {result}")]
                )
            except Exception as calc_error:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Calculation error: {str(calc_error)}")]
                )
        
        elif name == "write_file":
            filename = arguments.get("filename", "")
            content = arguments.get("content", "")
            
            if not filename:
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No filename provided")]
                )
            
            # Ensure safe filename
            safe_filename = os.path.basename(filename)
            try:
                with open(safe_filename, "w", encoding="utf-8") as f:
                    f.write(content)
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Successfully wrote {len(content)} characters to {safe_filename}")]
                )
            except Exception as write_error:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Write error: {str(write_error)}")]
                )
        
        elif name == "read_file":
            filename = arguments.get("filename", "")
            
            if not filename:
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No filename provided")]
                )
            
            # Ensure safe filename
            safe_filename = os.path.basename(filename)
            
            if not os.path.exists(safe_filename):
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: File {safe_filename} does not exist")]
                )
            
            try:
                with open(safe_filename, "r", encoding="utf-8") as f:
                    content = f.read()
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Content of {safe_filename}:\n\n{content}")]
                )
            except Exception as read_error:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Read error: {str(read_error)}")]
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
