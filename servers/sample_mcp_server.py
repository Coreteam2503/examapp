#!/usr/bin/env python3
"""
Sample MCP Server - Web Search and File Operations
This is a basic MCP server that provides web search and file operation tools
"""

import asyncio
import json
import os
import sys
from typing import Any, Sequence
from datetime import datetime

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
    print("MCP packages not installed. Run: pip install mcp")
    sys.exit(1)

# Initialize the MCP server
server = Server("sample-tools-server")

@server.list_tools()
async def list_tools() -> Sequence[Tool]:
    """List available tools"""
    return [
        Tool(
            name="web_search",
            description="Search the web for information using DuckDuckGo",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
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
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> CallToolResult:
    """Handle tool calls"""
    
    if name == "web_search":
        query = arguments.get("query")
        max_results = arguments.get("max_results", 5)
        
        try:
            # Simple DuckDuckGo search simulation
            # In a real implementation, you would use an actual search API
            results = f"""Search results for '{query}' (showing {max_results} results):

1. Sample Result 1 - This is a mock search result for '{query}'
   URL: https://example1.com
   Description: Mock description for the first result

2. Sample Result 2 - Another mock result related to '{query}'
   URL: https://example2.com
   Description: Mock description for the second result

3. Sample Result 3 - Third mock result for '{query}'
   URL: https://example3.com
   Description: Mock description for the third result

Note: This is a mock search. In production, integrate with real search APIs like SerpAPI, DuckDuckGo API, etc."""
            
            return CallToolResult(
                content=[TextContent(type="text", text=results)]
            )
        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Search error: {str(e)}")]
            )
    
    elif name == "write_file":
        filename = arguments.get("filename")
        content = arguments.get("content")
        
        try:
            # Ensure the file is written in a safe location
            safe_filename = os.path.basename(filename)  # Prevent directory traversal
            with open(safe_filename, "w", encoding="utf-8") as f:
                f.write(content)
            return CallToolResult(
                content=[TextContent(type="text", text=f"Successfully wrote {len(content)} characters to {safe_filename}")]
            )
        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Error writing file: {str(e)}")]
            )
    
    elif name == "read_file":
        filename = arguments.get("filename")
        
        try:
            # Ensure safe file reading
            safe_filename = os.path.basename(filename)  # Prevent directory traversal
            if not os.path.exists(safe_filename):
                return CallToolResult(
                    content=[TextContent(type="text", text=f"File {safe_filename} does not exist")]
                )
            
            with open(safe_filename, "r", encoding="utf-8") as f:
                content = f.read()
            return CallToolResult(
                content=[TextContent(type="text", text=f"Content of {safe_filename}:\n\n{content}")]
            )
        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Error reading file: {str(e)}")]
            )
    
    elif name == "calculate":
        expression = arguments.get("expression")
        
        try:
            # Safe mathematical evaluation
            import math
            
            # Allow only safe mathematical operations
            allowed_names = {
                k: v for k, v in math.__dict__.items() if not k.startswith("__")
            }
            allowed_names.update({"abs": abs, "round": round})
            
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return CallToolResult(
                content=[TextContent(type="text", text=f"Result: {expression} = {result}")]
            )
        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Calculation error: {str(e)}")]
            )
    
    elif name == "get_current_time":
        time_format = arguments.get("format", "%Y-%m-%d %H:%M:%S")
        
        try:
            current_time = datetime.now().strftime(time_format)
            return CallToolResult(
                content=[TextContent(type="text", text=f"Current time: {current_time}")]
            )
        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Time error: {str(e)}")]
            )
    
    else:
        raise ValueError(f"Unknown tool: {name}")

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
