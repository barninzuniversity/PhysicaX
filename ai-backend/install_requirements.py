import subprocess
import sys
import os


def run(cmd):
    print(f">>> {' '.join(cmd)}")
    subprocess.check_call(cmd)


def main():
    run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])


if __name__ == "__main__":
    main()
