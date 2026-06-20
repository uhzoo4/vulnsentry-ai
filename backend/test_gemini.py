import os
import sys
from dotenv import load_dotenv

# Try importing google-generativeai
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

def main():
    print("==============================================")
    print("VULNSENTRY AI — GEMINI CONNECTIVITY CHECKER")
    print("==============================================")

    # 1. Load config
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    print(f"[*] Target Model: {model_name}")

    if not api_key:
        print("[WARNING] GEMINI_API_KEY is not set in your environment or .env file.")
        print("[*] Please set GEMINI_API_KEY to test live generative AI features.")
        sys.exit(1)

    print("[+] GEMINI_API_KEY is configured.")

    if not HAS_GENAI:
        print("[ERROR] google-generativeai package is not installed.")
        print("[*] Please run: pip install -r requirements.txt")
        sys.exit(1)

    # 2. Configure SDK
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"[ERROR] Failed to configure Gemini SDK: {e}")
        sys.exit(1)

    # 3. Trigger Test Generation
    print("[*] Sending test request to Gemini API...")
    prompt = (
        "Explain in one short sentence why exposing port 3306 (MySQL) publicly is a risk. "
        "Respond in a defensive, educational tone."
    )
    
    try:
        start_time = time_now = sys.modules['time'].time() if 'time' in sys.modules else 0
        import time
        start_time = time.time()
        
        response = model.generate_content(prompt)
        duration = time.time() - start_time
        
        print(f"[+] Connection Successful! (Time taken: {duration:.2f}s)")
        print("\n[+] Gemini Response:")
        print(response.text.strip())
        print("==============================================")
    except Exception as e:
        print(f"[ERROR] Gemini API request failed: {e}")
        print("[*] Ensure your key is valid and you have network connectivity to the Gemini API endpoint.")
        sys.exit(1)

if __name__ == "__main__":
    main()
