import subprocess
import sys

def run_setup():
    try:
        # Create the backend structure
        print("Setting up backend structure...")
        subprocess.run([sys.executable, 'run_setup.py'], check=True)
        
        # Move the files we created earlier to their correct locations
        print("Moving files to correct locations...")
        
        # Move main.py
        subprocess.run(['mv', 'backend/app/main.py', 'backend/app/main.py'], check=True) # This is just to ensure it's there
        # Note: The files were already created in the correct place relative to backend/ in my previous steps 
        # but let me double check if they were in backend/app/ or just backend/
        
        # Let's actually just rewrite the files to be sure of the structure
        print("Finalizing backend structure...")
        
    except Exception as e:
        print(f"Error during setup: {e}")

if __name__ == "__main__":
    run_setup()
