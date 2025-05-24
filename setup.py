#!/usr/bin/env python3
"""
Project Setup and Test Script
Automates the setup process and runs validation tests
"""

import os
import sys
import subprocess
from pathlib import Path
import pkg_resources
from typing import List, Tuple

class ProjectSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.requirements_file = self.project_root / "requirements.txt"
        
    def check_python_version(self) -> bool:
        """Check if Python version is compatible"""
        version = sys.version_info
        print(f"Python version: {version.major}.{version.minor}.{version.micro}")
        
        if version.major != 3 or version.minor not in [10, 11]:
            print("❌ Python 3.10 or 3.11 required")
            return False
        
        print("✅ Python version compatible")
        return True
    
    def install_requirements(self) -> bool:
        """Install required packages"""
        if not self.requirements_file.exists():
            print("❌ requirements.txt not found")
            return False
        
        print("📦 Installing requirements...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", str(self.requirements_file)
            ])
            print("✅ Requirements installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install requirements: {e}")
            return False
    
    def check_installed_packages(self) -> List[Tuple[str, bool]]:
        """Check which required packages are installed"""
        required_packages = [
            "crewai",
            "crewai-tools", 
            "mcp",
            "python-dotenv",
            "loguru",
            "rich",
            "pydantic"
        ]
        
        results = []
        for package in required_packages:
            try:
                pkg_resources.get_distribution(package)
                results.append((package, True))
            except pkg_resources.DistributionNotFound:
                results.append((package, False))
        
        return results
    
    def test_mcp_server(self) -> bool:
        """Test if MCP server can be imported and run"""
        server_script = self.project_root / "servers" / "sample_mcp_server.py"
        
        if not server_script.exists():
            print("❌ MCP server script not found")
            return False
        
        print("🔧 Testing MCP server import...")
        try:
            # Test Python syntax by compiling
            with open(server_script, 'r') as f:
                code = f.read()
            compile(code, str(server_script), 'exec')
            print("✅ MCP server script syntax is valid")
            return True
        except SyntaxError as e:
            print(f"❌ MCP server script has syntax error: {e}")
            return False
        except Exception as e:
            print(f"❌ MCP server script error: {e}")
            return False
    
    def create_env_file(self) -> bool:
        """Create .env file from template if it doesn't exist"""
        env_file = self.project_root / ".env"
        env_template = self.project_root / ".env.template"
        
        if env_file.exists():
            print("✅ .env file already exists")
            return True
        
        if not env_template.exists():
            print("❌ .env.template not found")
            return False
        
        try:
            env_template.rename(env_file)
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file and add your API keys")
            return True
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    
    def test_basic_import(self) -> bool:
        """Test basic imports"""
        print("🧪 Testing basic imports...")
        
        try:
            import crewai
            print(f"✅ CrewAI version: {crewai.__version__}")
        except ImportError as e:
            print(f"❌ CrewAI import failed: {e}")
            return False
        
        try:
            from crewai_tools import MCPServerAdapter
            print("✅ MCPServerAdapter imported successfully")
        except ImportError as e:
            print(f"❌ MCPServerAdapter import failed: {e}")
            return False
        
        try:
            from mcp import StdioServerParameters
            print("✅ MCP imports successful")
        except ImportError as e:
            print(f"❌ MCP import failed: {e}")
            return False
        
        return True
    
    def run_setup(self):
        """Run complete setup process"""
        print("🚀 CrewAI + MCP Project Setup")
        print("=" * 40)
        
        # Check Python version
        if not self.check_python_version():
            return False
        
        # Install requirements
        if not self.install_requirements():
            return False
        
        # Check installed packages
        print("\n📋 Checking installed packages:")
        packages = self.check_installed_packages()
        all_installed = True
        
        for package, installed in packages:
            status = "✅" if installed else "❌"
            print(f"{status} {package}")
            if not installed:
                all_installed = False
        
        if not all_installed:
            print("\n⚠️  Some packages are missing. Run: pip install -r requirements.txt")
        
        # Test basic imports
        if not self.test_basic_import():
            return False
        
        # Test MCP server
        if not self.test_mcp_server():
            return False
        
        # Create .env file
        self.create_env_file()
        
        print("\n✅ Setup completed successfully!")
        print("\nNext steps:")
        print("1. Edit .env file and add your OpenAI API key")
        print("2. Run: python crew_runner.py")
        print("3. Or run examples: python examples/basic_example.py")
        
        return True

def main():
    setup = ProjectSetup()
    setup.run_setup()

if __name__ == "__main__":
    main()
