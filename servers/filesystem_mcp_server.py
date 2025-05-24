#!/usr/bin/env python3
"""
Filesystem MCP Server
Provides comprehensive file system operations for CrewAI agents
"""

import asyncio
import os
import sys
import shutil
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
server = Server("filesystem-mcp-server")

@server.list_tools()
async def list_tools() -> Sequence[Tool]:
    """List available filesystem tools"""
    return [
        Tool(
            name="read_file",
            description="Read the complete contents of a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to read"
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="write_file",
            description="Write content to a file (creates or overwrites)",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to write"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to the file"
                    },
                    "create_directories": {
                        "type": "boolean",
                        "description": "Create parent directories if they don't exist",
                        "default": True
                    }
                },
                "required": ["file_path", "content"]
            }
        ),
        Tool(
            name="append_to_file",
            description="Append content to an existing file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to append to"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to append to the file"
                    }
                },
                "required": ["file_path", "content"]
            }
        ),
        Tool(
            name="create_directory",
            description="Create a directory (and parent directories if needed)",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory to create"
                    }
                },
                "required": ["directory_path"]
            }
        ),
        Tool(
            name="list_files",
            description="List files and directories in a path with detailed information",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory to list",
                        "default": "."
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "List files recursively",
                        "default": False
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
            name="copy_file",
            description="Copy a file to another location",
            inputSchema={
                "type": "object",
                "properties": {
                    "source_path": {
                        "type": "string",
                        "description": "Path to the source file"
                    },
                    "destination_path": {
                        "type": "string",
                        "description": "Path to the destination"
                    }
                },
                "required": ["source_path", "destination_path"]
            }
        ),
        Tool(
            name="move_file",
            description="Move/rename a file or directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "source_path": {
                        "type": "string",
                        "description": "Path to the source file/directory"
                    },
                    "destination_path": {
                        "type": "string",
                        "description": "Path to the destination"
                    }
                },
                "required": ["source_path", "destination_path"]
            }
        ),
        Tool(
            name="delete_file",
            description="Delete a file or directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file or directory to delete"
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "Delete directories recursively",
                        "default": False
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="get_file_info",
            description="Get detailed information about a file or directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file or directory"
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="search_files",
            description="Search for files by name pattern",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory_path": {
                        "type": "string",
                        "description": "Directory to search in",
                        "default": "."
                    },
                    "pattern": {
                        "type": "string",
                        "description": "File name pattern (supports wildcards)"
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "Search recursively in subdirectories",
                        "default": True
                    }
                },
                "required": ["pattern"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> CallToolResult:
    """Handle tool calls"""
    
    try:
        if name == "read_file":
            file_path = arguments.get("file_path", "")
            
            if not file_path.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No file path provided")]
                )
            
            try:
                if not os.path.exists(file_path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: File '{file_path}' does not exist")]
                    )
                
                if not os.path.isfile(file_path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: '{file_path}' is not a file")]
                    )
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                output = f"Content of '{file_path}':\n\n{content}"
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error reading file: {str(e)}")]
                )
        
        elif name == "write_file":
            file_path = arguments.get("file_path", "")
            content = arguments.get("content", "")
            create_dirs = arguments.get("create_directories", True)
            
            if not file_path.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No file path provided")]
                )
            
            try:
                # Create parent directories if needed
                if create_dirs:
                    parent_dir = os.path.dirname(file_path)
                    if parent_dir and not os.path.exists(parent_dir):
                        os.makedirs(parent_dir)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                output = f"✅ Successfully wrote {len(content)} characters to '{file_path}'"
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error writing file: {str(e)}")]
                )
        
        elif name == "append_to_file":
            file_path = arguments.get("file_path", "")
            content = arguments.get("content", "")
            
            if not file_path.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No file path provided")]
                )
            
            try:
                with open(file_path, 'a', encoding='utf-8') as f:
                    f.write(content)
                
                output = f"✅ Successfully appended {len(content)} characters to '{file_path}'"
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error appending to file: {str(e)}")]
                )
        
        elif name == "create_directory":
            dir_path = arguments.get("directory_path", "")
            
            if not dir_path.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No directory path provided")]
                )
            
            try:
                os.makedirs(dir_path, exist_ok=True)
                output = f"✅ Successfully created directory '{dir_path}'"
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error creating directory: {str(e)}")]
                )
        
        elif name == "list_files":
            dir_path = arguments.get("directory_path", ".")
            recursive = arguments.get("recursive", False)
            show_hidden = arguments.get("show_hidden", False)
            
            try:
                if not os.path.exists(dir_path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: Directory '{dir_path}' does not exist")]
                    )
                
                if not os.path.isdir(dir_path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: '{dir_path}' is not a directory")]
                    )
                
                items = []
                
                if recursive:
                    for root, dirs, files in os.walk(dir_path):
                        # Filter hidden items
                        if not show_hidden:
                            dirs[:] = [d for d in dirs if not d.startswith('.')]
                            files = [f for f in files if not f.startswith('.')]
                        
                        level = root.replace(dir_path, '').count(os.sep)
                        indent = '  ' * level
                        items.append(f"{indent}📁 {os.path.basename(root)}/")
                        
                        sub_indent = '  ' * (level + 1)
                        for file in files:
                            file_path = os.path.join(root, file)
                            size = os.path.getsize(file_path)
                            items.append(f"{sub_indent}📄 {file} ({size} bytes)")
                else:
                    for item in sorted(os.listdir(dir_path)):
                        if not show_hidden and item.startswith('.'):
                            continue
                        
                        item_path = os.path.join(dir_path, item)
                        if os.path.isdir(item_path):
                            items.append(f"📁 {item}/")
                        else:
                            size = os.path.getsize(item_path)
                            items.append(f"📄 {item} ({size} bytes)")
                
                output = f"Contents of '{os.path.abspath(dir_path)}':\n\n"
                if items:
                    output += "\n".join(items)
                else:
                    output += "(Empty directory)"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=output)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error listing files: {str(e)}")]
                )
        
        # Add implementations for other tools...
        elif name == "get_file_info":
            file_path = arguments.get("file_path", "")
            
            if not file_path.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: No file path provided")]
                )
            
            try:
                if not os.path.exists(file_path):
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Error: Path '{file_path}' does not exist")]
                    )
                
                stat = os.stat(file_path)
                abs_path = os.path.abspath(file_path)
                
                info = f"File Information for '{abs_path}':\n\n"
                info += f"Type: {'Directory' if os.path.isdir(file_path) else 'File'}\n"
                info += f"Size: {stat.st_size} bytes\n"
                info += f"Created: {stat.st_ctime}\n"
                info += f"Modified: {stat.st_mtime}\n"
                info += f"Permissions: {oct(stat.st_mode)[-3:]}\n"
                
                return CallToolResult(
                    content=[TextContent(type="text", text=info)]
                )
                
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error getting file info: {str(e)}")]
                )
        
        else:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Error: Tool '{name}' not yet implemented")]
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
