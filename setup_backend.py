
import os

# Create directories
os.makedirs('backend/app/api', exist_ok=True)
os.makedirs('backend/app/services', exist_ok=True)
os.makedirs('backend/app/schemas', exist_ok=True)
os.makedirs('backend/app/core', exist_ok=True)

# Create __init__.py files to make them packages
with open('backend/app/__init__.py', 'w') as f: pass
with open('backend/app/api/__init__.py', 'w') as f: pass
with open('backend/app/services/__init__.py', 'w') as f: pass
with open('backend/app/schemas/__init__.py', 'w') as f: pass
with open('backend/app/core/__init__.py', 'w') as f: pass

print("Backend directory structure created successfully.")
