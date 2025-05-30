# In your main_experiment.py, change the import to:
import sys
sys.path.append('../examples/prd_task_breakdown')
from prd_task_breakdown_mesh import PRDTaskBreakdownMesh

mesh = PRDTaskBreakdownMesh(output_dir="/Users/balajiv/Documents/coderepos/agentic_mesh/setup_1/WIP/docs")
result = mesh.process_prd("/Users/balajiv/Documents/coderepos/agentic_mesh/setup_1/WIP/prd.md")
print(result)