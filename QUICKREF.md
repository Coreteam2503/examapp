# 🚀 Quick Reference - CrewAI MCP Integration

## Essential Commands

```bash
# 🎯 Main test - demonstrates both goals
python comprehensive_test.py

# ⚡ Quick agent collaboration test  
python quick_test.py

# 🚀 Interactive menu with all options
./scripts/start.sh

# 📊 Check system status
python check_status.py
```

## Goals Achievement Verification

### ✅ Goal 1: Agents Talking to Each Other
```bash
python comprehensive_test.py
# Look for: "Agent Collaboration: ✅ SUCCESS"
# Evidence: Multiple agents working together sequentially
```

### ✅ Goal 2: MCP Servers Integration
```bash
python comprehensive_test.py  
# Look for: "MCP Integration: ✅ SUCCESS"
# Evidence: SQL queries executed via MCP server
```

## Project Structure

```
setup_1/
├── comprehensive_test.py    # 🎯 Main demonstration
├── quick_test.py           # ⚡ Fast collaboration test
├── scripts/start.sh        # 🚀 Interactive launcher
├── USAGE.md               # 📚 Complete usage guide
├── check_status.py        # 📊 System health check
├── tmp/                   # 🗑️ Test data (deletable)
└── logs/                  # 📝 Results and logs
```

## Troubleshooting

```bash
# Environment issues
source venv/bin/activate

# API key issues  
grep OPENAI_API_KEY .env

# MCP server issues
mcp-server-sqlite --help

# Clean restart
rm -rf tmp/ && python tmp/create_sample_db.py
```

## What Each Test Does

### comprehensive_test.py
- **Duration:** 60-90 seconds
- **Agents:** 3 agents collaborate
- **MCP:** Real SQLite server integration
- **Output:** Business intelligence report

### quick_test.py  
- **Duration:** 30 seconds
- **Agents:** 2 agents collaborate
- **Focus:** Agent communication
- **Output:** Research summary

### scripts/start.sh
- **Interactive menu**
- **Guided setup**
- **Custom queries**
- **Server installation**

## Success Indicators

✅ **Both Goals Working:** "🎉 COMPREHENSIVE TEST COMPLETED!"
✅ **Agent Collaboration:** Multiple agents in conversation logs
✅ **MCP Integration:** SQL queries visible in output  
✅ **System Health:** All status checks pass

## Next Steps

1. **Extend Database:** Add your own data to `tmp/sample_company.db`
2. **Custom Agents:** Modify agent roles in `comprehensive_test.py`
3. **More MCP Servers:** Install additional servers via menu option 3
4. **Production Use:** Build your own workflows using the examples

**🎯 Ready to use! Both goals achieved and system operational.** 🚀
