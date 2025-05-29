#!/usr/bin/env python3
"""
Setup Script for CrewAI MCP Integration
This script helps install and configure the necessary MCP servers.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MCPSetup:
    """Setup and configuration for MCP servers."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.system = platform.system().lower()
        
    def check_prerequisites(self):
        """Check if required tools are installed."""
        print("Checking prerequisites...")
        
        prerequisites = {
            "python": {"command": ["python", "--version"], "description": "Python 3.8+"},
            "node": {"command": ["node", "--version"], "description": "Node.js 18+"},
            "npm": {"command": ["npm", "--version"], "description": "npm package manager"},
            "git": {"command": ["git", "--version"], "description": "Git version control"}
        }
        
        missing = []
        
        for tool, info in prerequisites.items():
            try:
                result = subprocess.run(
                    info["command"], 
                    capture_output=True, 
                    text=True, 
                    check=True
                )
                print(f"✅ {tool}: {result.stdout.strip()}")
            except (subprocess.CalledProcessError, FileNotFoundError):
                print(f"❌ {tool}: Not found")
                missing.append(f"{tool} ({info['description']})")
        
        if missing:
            print(f"\n⚠️  Missing prerequisites: {', '.join(missing)}")
            print("\nPlease install the missing tools and run setup again.")
            return False
        
        print("✅ All prerequisites found!")
        return True
    
    def install_python_dependencies(self):
        """Install Python dependencies."""
        print("\nInstalling Python dependencies...")
        
        try:
            # Install requirements
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ], check=True, cwd=self.project_root)
            print("✅ Python dependencies installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install Python dependencies: {e}")
            return False
    
    def install_uv_uvx(self):
        """Install uv/uvx for Python MCP servers."""
        print("\nInstalling uv/uvx...")
        
        try:
            # Check if uv is already installed
            subprocess.run(["uv", "--version"], capture_output=True, check=True)
            print("✅ uv already installed!")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
        
        try:
            # Install uv
            subprocess.run([
                sys.executable, "-m", "pip", "install", "uv"
            ], check=True)
            print("✅ uv installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install uv: {e}")
            return False
    
    def install_mcp_servers(self):
        """Install the MCP servers we'll be using."""
        print("\nInstalling MCP servers...")
        
        servers = {
            "filesystem": {
                "type": "npm",
                "package": "@modelcontextprotocol/server-filesystem",
                "description": "Filesystem operations server"
            },
            "fetch": {
                "type": "npm", 
                "package": "@modelcontextprotocol/server-fetch",
                "description": "Web content fetching server"
            },
            "git": {
                "type": "python",
                "package": "mcp-server-git",
                "description": "Git repository operations server"
            }
        }
        
        success_count = 0
        
        for name, info in servers.items():
            print(f"\nInstalling {name} MCP server ({info['description']})...")
            
            try:
                if info["type"] == "npm":
                    # Install NPM package globally
                    subprocess.run([
                        "npm", "install", "-g", info["package"]
                    ], check=True)
                elif info["type"] == "python":
                    # Install Python package with uvx
                    subprocess.run([
                        "uvx", "install", info["package"]
                    ], check=True)
                
                print(f"✅ {name} server installed successfully!")
                success_count += 1
                
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install {name} server: {e}")
                print(f"   You can try installing manually later.")
        
        print(f"\n📦 Installed {success_count}/{len(servers)} MCP servers successfully!")
        return success_count > 0
    
    def test_mcp_servers(self):
        """Test if MCP servers can be launched."""
        print("\nTesting MCP server installations...")
        
        tests = [
            {
                "name": "filesystem",
                "command": ["npx", "@modelcontextprotocol/server-filesystem", "--help"],
                "description": "Filesystem MCP server"
            },
            {
                "name": "fetch", 
                "command": ["npx", "@modelcontextprotocol/server-fetch", "--help"],
                "description": "Fetch MCP server"
            },
            {
                "name": "git",
                "command": ["uvx", "mcp-server-git", "--help"],
                "description": "Git MCP server"
            }
        ]
        
        working_servers = []
        
        for test in tests:
            try:
                result = subprocess.run(
                    test["command"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0 or "help" in result.stdout.lower() or "usage" in result.stdout.lower():
                    print(f"✅ {test['name']}: Working")
                    working_servers.append(test["name"])
                else:
                    print(f"⚠️  {test['name']}: May have issues")
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
                print(f"❌ {test['name']}: Not working ({e})")
        
        print(f"\n🔧 {len(working_servers)}/{len(tests)} servers are working properly!")
        return working_servers
    
    def initialize_git_repo(self):
        """Initialize git repository if not present."""
        git_dir = self.project_root / ".git"
        
        if git_dir.exists():
            print("✅ Git repository already initialized!")
            return True
        
        print("\nInitializing Git repository...")
        try:
            subprocess.run(["git", "init"], cwd=self.project_root, check=True)
            subprocess.run(["git", "add", "."], cwd=self.project_root, check=True)
            subprocess.run([
                "git", "commit", "-m", "Initial commit - CrewAI MCP Integration setup"
            ], cwd=self.project_root, check=True)
            print("✅ Git repository initialized!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Git initialization failed: {e}")
            return False
    
    def create_run_scripts(self):
        """Create convenient run scripts."""
        print("\nCreating run scripts...")
        
        scripts = {
            "run_simple.py": """#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / 'examples'))
from simple_filesystem_example import main
if __name__ == "__main__":
    main()
""",
            "run_git.py": """#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / 'examples'))
from git_analysis_example import main
if __name__ == "__main__":
    main()
""",
            "run_web.py": """#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / 'examples'))
from web_research_example import main
if __name__ == "__main__":
    main()
""",
            "run_main.py": """#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / 'src'))
from main_example import main
if __name__ == "__main__":
    main()
"""
        }
        
        for script_name, content in scripts.items():
            script_path = self.project_root / script_name
            with open(script_path, "w") as f:
                f.write(content)
            
            # Make executable on Unix systems
            if self.system in ["linux", "darwin"]:
                os.chmod(script_path, 0o755)
        
        print("✅ Run scripts created!")
    
    def show_next_steps(self, working_servers):
        """Show next steps to the user."""
        print("\n" + "="*60)
        print("🎉 SETUP COMPLETED!")
        print("="*60)
        
        print(f"\n📁 Project location: {self.project_root}")
        print(f"🔧 Working MCP servers: {', '.join(working_servers) if working_servers else 'None'}")
        
        print("\n🚀 Next Steps:")
        print("1. Make sure your OpenAI API key is set in .env file")
        print("2. Test the examples:")
        
        if "filesystem" in working_servers:
            print("   python run_simple.py    # Simple filesystem example")
        if "git" in working_servers:
            print("   python run_git.py       # Git repository analysis")
        if "fetch" in working_servers:
            print("   python run_web.py       # Web content research")
        if len(working_servers) > 1:
            print("   python run_main.py      # Full multi-server example")
        
        print("\n📚 Documentation:")
        print(f"   {self.project_root / 'docs' / 'crewai_mcp_documentation.md'}")
        
        print("\n🔍 Logs:")
        print(f"   {self.project_root / 'logs'}")
        
        if not working_servers:
            print("\n⚠️  No MCP servers are working. Check the troubleshooting section.")
            print("   You may need to install Node.js, uv, or the specific MCP packages manually.")
    
    def run_setup(self):
        """Run the complete setup process."""
        print("CrewAI MCP Integration Setup")
        print("="*40)
        
        # Check prerequisites
        if not self.check_prerequisites():
            return False
        
        # Install Python dependencies
        if not self.install_python_dependencies():
            return False
        
        # Install uv/uvx
        if not self.install_uv_uvx():
            return False
        
        # Install MCP servers
        if not self.install_mcp_servers():
            print("⚠️  MCP server installation had issues, but continuing...")
        
        # Test servers
        working_servers = self.test_mcp_servers()
        
        # Initialize git repo
        self.initialize_git_repo()
        
        # Create run scripts
        self.create_run_scripts()
        
        # Show next steps
        self.show_next_steps(working_servers)
        
        return True


def main():
    """Main entry point."""
    setup = MCPSetup()
    
    try:
        success = setup.run_setup()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
