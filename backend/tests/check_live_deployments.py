import httpx
import re
import time
import sys

def check():
    url = "https://verified-fix-six.vercel.app/"
    print(f"Checking {url}...")
    headers = {"Cache-Control": "no-cache", "Pragma": "no-cache"}
    r = httpx.get(url, headers=headers)
    print("Vercel HTTP Status:", r.status_code)
    
    matches = re.findall(r'/assets/index-[A-Za-z0-9_-]+\.js', r.text)
    if matches:
        script_url = "https://verified-fix-six.vercel.app" + matches[0]
        print(f"Loaded script: {script_url}")
        js_res = httpx.get(script_url, headers=headers)
        has_onrender = "verifiedfix.onrender.com" in js_res.text
        has_cors_fix = "VITE_API_BASE_URL" in js_res.text or has_onrender
        print(f"Contains onrender backend URL: {has_onrender}")
        return has_onrender
    else:
        print("Could not find script tag in HTML.")
        return False

if __name__ == "__main__":
    success = check()
    sys.exit(0 if success else 1)
