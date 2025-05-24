# 3-Agent Development Team Startup

This startup script creates a specialized development team of 3 CrewAI agents with comprehensive MCP tool access.

## 🏗️ Agent Roles

### 1. 👑 **Supervisor Agent**
- **Role**: Project planning and coordination
- **Responsibilities**:
  - Analyze project requirements
  - Break down complex tasks into manageable pieces
  - Create project structure and specifications
  - Define testing criteria
  - Make high-level architectural decisions
- **Focus**: Big picture planning, not implementation details

### 2. 💻 **Developer Agent** 
- **Role**: Code implementation
- **Responsibilities**:
  - Read specifications from supervisor
  - Write clean, functional code
  - Create files and project structure
  - Follow coding best practices
  - Document implementation progress
- **Focus**: Pure coding and implementation, no architectural decisions

### 3. 🧪 **Tester Agent**
- **Role**: Quality assurance and testing
- **Responsibilities**:
  - Test code implementations
  - Run automated and manual tests
  - Identify bugs and issues
  - Verify requirements are met
  - Create comprehensive test reports
- **Focus**: Testing and validation, no code modification

## 🛠️ MCP Tools Available

The agents have access to **18 powerful MCP tools** across 3 servers:

### Terminal Server (4 tools)
- `execute_command` - Run terminal commands
- `list_directory` - List directory contents
- `check_command_exists` - Verify command availability
- `get_environment_variable` - Access environment variables

### Filesystem Server (10 tools)
- `read_file` / `write_file` - File operations
- `create_directory` - Directory creation
- `list_files` - Advanced file listing
- `copy_file` / `move_file` - File management
- `delete_file` - File deletion
- `append_to_file` - Content appending
- `get_file_info` - File metadata
- `search_files` - File search by pattern

### Simple Tools Server (4 tools)
- `get_current_time` - Timestamp operations
- `calculate` - Mathematical calculations
- Basic file read/write operations

## 🚀 Quick Start

### Prerequisites
1. **OpenAI API Key** - Add to `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

2. **Test MCP Servers**:
   ```bash
   python3.10 test_3_agents_mcp.py
   ```

### Running the 3-Agent Team

#### Interactive Mode
```bash
python3.10 startup_3_agents.py
```
Choose from sample projects or describe your own requirement.

#### Direct Mode
```bash
python3.10 startup_3_agents.py "Create a simple Python calculator"
```
Provide the project requirement as a command-line argument.

## 🎯 Sample Projects

1. **Simple Python Calculator** - Basic arithmetic operations
2. **Todo List Manager** - File-based task management
3. **Web Scraper** - News headline extraction
4. **Password Generator** - Customizable password creation
5. **File Organizer** - Sort files by extension

## 📋 Workflow Process

The 3-agent team follows a **sequential workflow**:

```
1️⃣ SUPERVISOR: Planning Phase
   ├── Analyze project requirements
   ├── Create project_plan.txt
   ├── Define task specifications
   └── Set up project structure

2️⃣ DEVELOPER: Implementation Phase
   ├── Read project_plan.txt
   ├── Implement code according to specs
   ├── Create necessary files
   └── Generate development_log.txt

3️⃣ TESTER: Validation Phase
   ├── Review project plan and code
   ├── Run comprehensive tests
   ├── Verify functionality
   └── Create test_report.txt
```

## 📁 Generated Artifacts

After completion, the team creates:
- **`project_plan.txt`** - Supervisor's analysis and specifications
- **`development_log.txt`** - Developer's implementation notes
- **`test_report.txt`** - Tester's comprehensive findings
- **Code files** - The actual implementation

## 🔧 Advanced Usage

### Custom Requirements
You can provide any software development requirement:
```bash
python3.10 startup_3_agents.py "Build a REST API for user management with SQLite database"
```

### Monitoring Progress
The agents provide verbose output showing:
- Tool usage and results
- Decision-making process
- Inter-agent communication
- File operations and terminal commands

## 🛡️ Safety Features

- **Sandboxed execution** - Terminal commands run safely
- **File path validation** - Prevents directory traversal
- **Role separation** - Each agent stays in their domain
- **Error handling** - Graceful failure recovery

## 🔍 Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**
   - Add your API key to `.env` file
   - Ensure it's not the placeholder value

2. **"MCP connection failed"**
   - Run `python3.10 test_3_agents_mcp.py`
   - Check server script permissions

3. **"Missing required packages"**
   - Run `python3.10 setup.py`
   - Install dependencies with `pip install -r requirements.txt`

### Debug Mode:
Set `DEBUG=True` in `.env` for detailed logging.

## 🎨 Customization

### Adding New Tools
1. Modify MCP server files in `servers/`
2. Add new tool definitions
3. Test with `python3.10 test_3_agents_mcp.py`

### Modifying Agent Behavior
1. Edit agent backstories in `startup_3_agents.py`
2. Adjust `max_iter` for more/fewer iterations
3. Modify task descriptions for different workflows

### Creating New Workflows
1. Duplicate `startup_3_agents.py`
2. Modify the `create_project_tasks()` method
3. Add new agent roles as needed

## 📊 Performance Tips

- **Small projects**: Usually complete in 5-10 minutes
- **Complex projects**: May take 15-30 minutes
- **Token usage**: Monitor API costs for large projects
- **Parallel processing**: Consider `Process.hierarchical` for complex tasks

## 🔗 Integration

This 3-agent system can be integrated with:
- CI/CD pipelines
- Project management tools
- Version control systems
- Automated testing frameworks

---

**Ready to build?** Run `python3.10 startup_3_agents.py` and let the AI development team handle your project!
