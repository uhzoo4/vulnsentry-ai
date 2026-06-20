import logging
import asyncio
import platform
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("vulnsentry.ai_orchestrator")

# Try importing google-generativeai
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    logger.warning("google-generativeai package not found. AI features will fallback to static templates.")

STATIC_TEACH_BLOCKS = {
    "ftp-exposed": "FTP transmits credentials and files in plaintext, allowing attackers to sniff sensitive network traffic. Disable FTP and migrate to SFTP/SCP.",
    "ssh-exposed": "SSH provides remote terminal access. Exposing it publicly makes it a prime target for brute-force credential stuffing and exploit scanners.",
    "telnet-exposed": "Telnet is unencrypted and insecure. Passwords and commands can be easily intercepted by eavesdroppers on the network. Disable it immediately.",
    "smtp-exposed": "Exposed SMTP servers can be abused for email relaying, spam campaigns, or phishing attacks if they are not strictly secured.",
    "dns-exposed": "An exposed DNS service can be targeted for cache poisoning, or misused in DNS amplification denial-of-service (DoS) attacks.",
    "http-exposed": "HTTP web traffic is unencrypted, meaning sensitive cookie data, passwords, and form submissions can be stolen in transit. Use HTTPS instead.",
    "pop3-exposed": "POP3 transmits email messages and passwords in cleartext. Any listener on the local network can capture your mail credentials.",
    "rpcbind-exposed": "RPCBind maps RPC services to ports. If exposed, it leaks configuration details about local services, aiding reconnaissance.",
    "msrpc-exposed": "Microsoft RPC endpoint mapper is historically prone to remote code execution (RCE) exploits. It should never be exposed to untrusted networks.",
    "netbios-exposed": "NetBIOS leaks internal hostnames, domain structures, and usernames. It can be used by local attackers to map out the network.",
    "imap-exposed": "IMAP transmits email data and credentials in plaintext. Unencrypted mail access exposes sensitive user mailboxes.",
    "https-exposed": "HTTPS is secure, but exposing a server on port 443 means it represents a potential entry point if the application has web vulnerabilities.",
    "smb-exposed": "SMB is a high-risk file-sharing protocol frequently targeted by critical exploits (like EternalBlue). Exposing it can lead to full host compromise.",
    "imaps-exposed": "Secure IMAP is encrypted, but exposing it should be audited to ensure that weak SSL/TLS suites or outdated protocols are not accepted.",
    "pop3s-exposed": "Secure POP3 protects credentials via SSL/TLS, but any public listener represents an attack surface to be hardened.",
    "mssql-exposed": "Microsoft SQL Server holds highly sensitive database records. Public exposure invites brute-force attacks on DB credentials.",
    "oracle-exposed": "Oracle Database ports are frequently targeted. Outdated Oracle installations are susceptible to critical exploit vectors.",
    "nfs-exposed": "NFS (Network File System) shares files across systems. Unsecured NFS bindings can allow unauthorized root access to local storage directories.",
    "node-dev-exposed": "NodeJS development servers (like Express or Vite) often run in debug modes with hot-reloading active, making them easy vectors for code injection.",
    "mysql-exposed": "MySQL databases store business and application data. Exposing this port allows database connections, leading to brute-force or credential leaks.",
    "rdp-exposed": "Remote Desktop Protocol (RDP) is one of the most targeted administrative ports. Exploits or weak credentials grant full GUI control to attackers.",
    "python-dev-exposed": "Flask, Django, or FastAPI development servers run with reloaders and lack production-level security hardening, exposing internal errors to attackers.",
    "postgresql-exposed": "PostgreSQL database servers exposed to the network can be brute-forced or exploited if they allow insecure host authentication configurations.",
    "vnc-exposed": "VNC allows remote control of the desktop. Unencrypted or weakly authenticated VNC setups can be hijacked, granting graphical host control.",
    "redis-exposed": "Redis has no default password protection in standard developer setups. Exposing it allows full command execution, database wipes, or host takeover.",
    "dev-web-exposed": "Generic web development servers are not hardened for public traffic. They often leak directory listings or run under verbose debug modes.",
    "alt-http-exposed": "Alternative web services on port 8080 are frequently used for administrative interfaces or internal services that lack robust authentication.",
    "alt-https-exposed": "Alternative secure web interfaces represent an active HTTP endpoint that should be audited for outdated server certificates or software.",
    "php-fpm-exposed": "PHP-FPM exposes the fastcgi process. If reachable, attackers can execute arbitrary PHP commands directly on the server host.",
    "mongodb-exposed": "MongoDB databases without authentication configured allow immediate read/write access to all collections, leading to massive data theft."
}

def configure_genai() -> bool:
    if not HAS_GENAI:
        return False
    if not settings.GEMINI_API_KEY:
        # We don't log a duplicate warning here as main validate_config handles it
        return False
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return True
    except Exception:
        logger.error("Failed to configure Gemini SDK in orchestrator.")
        return False

class GeminiService:
    def __init__(self):
        self.configured = configure_genai()
        self.teach_cache = {}  # rule_id -> explanation text
        self.insight_cache = {}  # scan_id -> insight dictionary
        
    def get_model(self) -> Optional[Any]:
        if not self.configured or not settings.AI_ENABLED:
            return None
        try:
            return genai.GenerativeModel(settings.GEMINI_MODEL)
        except Exception:
            logger.error("Failed to retrieve GenerativeModel.")
            return None

    async def generate_holistic_insight(self, report: dict) -> dict:
        """
        Generates a consolidated 2-3 sentence recommendation for a scan report.
        Runs the blocking API call in an executor with a 20-second timeout.
        """
        scan_id = report.get("scanId", "default")
        if scan_id in self.insight_cache:
            return self.insight_cache[scan_id]
            
        default_insight = {
            "recommendation": "Scan complete. Hardening your database and network exposures is the best first step.",
            "topFindingId": ""
        }
        
        findings = report.get("findings", [])
        if not findings:
            return default_insight
            
        # Find the top critical/high finding based on risk score
        sorted_findings = sorted(findings, key=lambda x: x.get("riskScore", 0.0), reverse=True)
        top_finding = sorted_findings[0]
        top_id = top_finding.get("id", "")
        top_name = top_finding.get("serviceName", f"Port {top_finding.get('port')}")
        
        model = self.get_model()
        if not model:
            # Offline static fallback
            default_insight["recommendation"] = f"Exposing {top_name} on port {top_finding.get('port')} represents a major security risk. Consider securing it first to improve your score."
            default_insight["topFindingId"] = top_id
            return default_insight
            
        try:
            findings_text = "\n".join([
                f"- Port {f.get('port')} ({f.get('serviceName')}): risk {f.get('riskScore')}/10, owned by {f.get('processName')}"
                for f in sorted_findings[:5]
            ])
            
            prompt = (
                f"You are a cybersecurity immune system mentor analyzing a local machine scan. "
                f"Target OS: {platform.system()} {platform.release()}.\n\n"
                f"Scan Findings (top 5):\n{findings_text}\n\n"
                f"Summary statistics: {report['summary']}.\n\n"
                f"Provide a single action-oriented recommendation. Do not describe each port individually. "
                f"Highlight the single most critical finding ({top_name} on port {top_finding.get('port')}) "
                f"and summarize how to secure it to improve overall posture. "
                f"Limit your response strictly to 2 or 3 sentences maximum, in simple plain language for a junior developer."
            )
            
            loop = asyncio.get_event_loop()
            
            # Wrap blocking call in executor with 20s timeout
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None, 
                    lambda: model.generate_content(prompt)
                ),
                timeout=20.0
            )
            rec_text = response.text.strip()
            
            insight = {
                "recommendation": rec_text,
                "topFindingId": top_id
            }
            self.insight_cache[scan_id] = insight
            return insight
            
        except asyncio.TimeoutError:
            logger.error("Gemini timeout.")
            default_insight["recommendation"] = f"Exposing {top_name} on port {top_finding.get('port')} represents a major security risk. Consider securing it first to improve your score."
            default_insight["topFindingId"] = top_id
            return default_insight
        except Exception:
            logger.error("Gemini API failure during holistic insight.")
            default_insight["recommendation"] = f"Exposing {top_name} on port {top_finding.get('port')} represents a major security risk. Consider securing it first to improve your score."
            default_insight["topFindingId"] = top_id
            return default_insight

    async def generate_teach_block(
        self, 
        rule_id: str, 
        service_name: str, 
        port: int, 
        process_name: str
    ) -> str:
        """
        Generates a 2-3 sentence educational explanation for a specific finding.
        Caches result in memory and falls back to pre-written rules offline.
        """
        if rule_id in self.teach_cache:
            return self.teach_cache[rule_id]
            
        static_fallback = STATIC_TEACH_BLOCKS.get(rule_id, "No known risk signature. Secure this port if it is not in use.")
        
        model = self.get_model()
        if not model:
            return static_fallback
            
        try:
            prompt = (
                f"Explain this security finding to a junior developer in 2-3 simple sentences. "
                f"Finding: {service_name} exposed on Port {port} under process '{process_name}' (Rule: {rule_id}).\n\n"
                f"Why does this carry risk? What are the implications? Keep it educational, accurate, and concise."
            )
            
            loop = asyncio.get_event_loop()
            
            # Wrap blocking call in executor with 20s timeout
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: model.generate_content(prompt)
                ),
                timeout=20.0
            )
            explanation = response.text.strip()
            
            self.teach_cache[rule_id] = explanation
            return explanation
            
        except asyncio.TimeoutError:
            logger.error("Gemini timeout.")
            return static_fallback
        except Exception:
            logger.error("Gemini API failure during teach block.")
            return static_fallback
