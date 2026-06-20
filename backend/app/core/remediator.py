import platform
import asyncio
from typing import Optional, Dict, Any

REMEDIATION_COMMANDS = {
    "windows": {
        "ftp-exposed": {"command": "net stop ftpsvc", "description": "Stop the FTP service", "requiresAdmin": True},
        "ssh-exposed": {"command": "net stop sshd", "description": "Stop the OpenSSH SSH Server service", "requiresAdmin": True},
        "telnet-exposed": {"command": "net stop tlntsvr", "description": "Stop the Telnet service", "requiresAdmin": True},
        "smtp-exposed": {"command": "net stop smtpsvc", "description": "Stop the SMTP service", "requiresAdmin": True},
        "dns-exposed": {"command": "net stop dns", "description": "Stop the DNS server service", "requiresAdmin": True},
        "http-exposed": {"command": "iisreset /stop", "description": "Stop the IIS Web Server", "requiresAdmin": True},
        "smb-exposed": {"command": "net stop lanmanserver", "description": "Stop the Server service (SMB sharing)", "requiresAdmin": True},
        "mysql-exposed": {"command": "net stop MySQL", "description": "Stop the MySQL database service", "requiresAdmin": True},
        "postgresql-exposed": {"command": "net stop postgresql-x64-15", "description": "Stop the PostgreSQL database service", "requiresAdmin": True},
        "redis-exposed": {"command": "net stop redis", "description": "Stop the Redis service", "requiresAdmin": True},
        "mongodb-exposed": {"command": "net stop MongoDB", "description": "Stop the MongoDB service", "requiresAdmin": True},
        "rdp-exposed": {"command": "net stop TermService", "description": "Stop the Remote Desktop service", "requiresAdmin": True},
        "vnc-exposed": {"command": "net stop tvnserver", "description": "Stop the TightVNC service", "requiresAdmin": True},
    },
    "linux": {
        "ftp-exposed": {"command": "sudo systemctl stop vsftpd", "description": "Stop vsftpd service", "requiresAdmin": True},
        "ssh-exposed": {"command": "sudo systemctl stop sshd", "description": "Stop SSH daemon service", "requiresAdmin": True},
        "telnet-exposed": {"command": "sudo systemctl stop inetd", "description": "Stop inetd super-server", "requiresAdmin": True},
        "smtp-exposed": {"command": "sudo systemctl stop postfix", "description": "Stop Postfix mail server", "requiresAdmin": True},
        "dns-exposed": {"command": "sudo systemctl stop named", "description": "Stop BIND DNS server", "requiresAdmin": True},
        "http-exposed": {"command": "sudo systemctl stop apache2 || sudo systemctl stop nginx", "description": "Stop Apache or Nginx service", "requiresAdmin": True},
        "smb-exposed": {"command": "sudo systemctl stop smbd", "description": "Stop Samba SMB service", "requiresAdmin": True},
        "mysql-exposed": {"command": "sudo systemctl stop mysql", "description": "Stop MySQL database service", "requiresAdmin": True},
        "postgresql-exposed": {"command": "sudo systemctl stop postgresql", "description": "Stop PostgreSQL database service", "requiresAdmin": True},
        "redis-exposed": {"command": "sudo systemctl stop redis-server", "description": "Stop Redis database service", "requiresAdmin": True},
        "mongodb-exposed": {"command": "sudo systemctl stop mongod", "description": "Stop MongoDB database service", "requiresAdmin": True},
        "vnc-exposed": {"command": "sudo systemctl stop vncserver", "description": "Stop VNC server service", "requiresAdmin": True},
    },
    "macos": {
        "ftp-exposed": {"command": "sudo launchctl unload /System/Library/LaunchDaemons/ftp.plist", "description": "Unload FTP launch daemon", "requiresAdmin": True},
        "ssh-exposed": {"command": "sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist", "description": "Unload SSH launch daemon", "requiresAdmin": True},
        "http-exposed": {"command": "sudo apachectl stop", "description": "Stop Apache server", "requiresAdmin": True},
        "mysql-exposed": {"command": "brew services stop mysql", "description": "Stop Homebrew MySQL service", "requiresAdmin": False},
        "postgresql-exposed": {"command": "brew services stop postgresql", "description": "Stop Homebrew PostgreSQL service", "requiresAdmin": False},
        "redis-exposed": {"command": "brew services stop redis", "description": "Stop Homebrew Redis service", "requiresAdmin": False},
        "mongodb-exposed": {"command": "brew services stop mongodb-community", "description": "Stop Homebrew MongoDB service", "requiresAdmin": False},
    }
}

def get_remediation_for_finding(rule_id: str, pid: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Returns a remediation command dictionary for a given finding based on the host platform.
    Falls back to closing the process by PID if no standard system service command is available.
    """
    os_name = platform.system().lower()
    if os_name.startswith("win"):
        os_key = "windows"
    elif os_name.startswith("dar"):
        os_key = "macos"
    else:
        os_key = "linux"
        
    commands = REMEDIATION_COMMANDS.get(os_key, {})
    cmd_info = commands.get(rule_id)
    
    if cmd_info:
        return {
            "command": cmd_info["command"],
            "description": cmd_info["description"],
            "os": os_key,
            "requiresAdmin": cmd_info["requiresAdmin"]
        }
    
    # Fallback to closing the process directly if a PID is associated
    if pid and pid > 0:
        if os_key == "windows":
            return {
                "command": f"taskkill /F /PID {pid}",
                "description": f"Force close process (PID {pid}) to secure the port",
                "os": "windows",
                "requiresAdmin": False
            }
        else:
            return {
                "command": f"kill -9 {pid}",
                "description": f"Force terminate process (PID {pid}) to secure the port",
                "os": os_key,
                "requiresAdmin": False
            }
            
    return None

async def execute_remediation_command(command: str) -> Dict[str, Any]:
    """
    Asynchronously executes a shell command on the host.
    """
    try:
        os_name = platform.system().lower()
        if os_name.startswith("win"):
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
        else:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                executable="/bin/bash"
            )
            
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)
        
        result_text = stdout.decode("utf-8", errors="ignore").strip() or stderr.decode("utf-8", errors="ignore").strip()
        
        if proc.returncode == 0:
            return {
                "success": True,
                "result": result_text or "Command executed successfully."
            }
        else:
            return {
                "success": False,
                "result": f"Error (code {proc.returncode}): {result_text or 'Command failed.'}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "result": f"Execution error: {str(e)}"
        }
