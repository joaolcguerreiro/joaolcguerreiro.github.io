import urllib.request
import urllib.parse
import json
import re
import sys

def fetch_scholar_html(scholar_id):
    url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100"
    # Use corsproxy.io to bypass GitHub Actions IP blocking
    proxy_url = f"https://corsproxy.io/?{urllib.parse.quote(url)}"
    
    req = urllib.request.Request(proxy_url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        response = urllib.request.urlopen(req)
        html = response.read().decode('utf-8', errors='replace')
        
        if not html:
            raise ValueError("Empty contents returned from proxy")
        
        # Remove any embedded Google API keys to avoid secret leakage
        html = re.sub(r'apiKey:"AIza[^"]+"', 'apiKey:"REDACTED"', html)
        
        with open('scholar.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Successfully saved scholar.html")
    except Exception as e:
        print(f"Error fetching: {e}")
        # If it fails, we don't overwrite the existing scholar.html so the site doesn't break
        sys.exit(1)

if __name__ == '__main__':
    fetch_scholar_html('a89cK-wAAAAJ')
