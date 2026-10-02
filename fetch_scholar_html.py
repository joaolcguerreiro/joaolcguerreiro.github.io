import urllib.request
import urllib.parse
import json
import re
import sys
import time

def fetch_scholar_html(scholar_id):
    url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100"
    
    # Using a more realistic browser User-Agent and headers
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://scholar.google.com/",
    }
    
    req = urllib.request.Request(url, headers=headers)
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Fetching Google Scholar data (Attempt {attempt + 1}/{max_retries})...")
            response = urllib.request.urlopen(req, timeout=15)
            html = response.read().decode('utf-8', errors='replace')
            
            if not html:
                raise ValueError("Empty contents returned from Google Scholar")
                
            # Validate that we actually got a Google Scholar page
            if 'id="gsc_a_b"' not in html:
                raise ValueError("Invalid Google Scholar page returned (missing gsc_a_b). You might be blocked by Google Scholar.")
            
            # Remove any embedded Google API keys to avoid secret leakage
            html = re.sub(r'apiKey:"AIza[^"]+"', 'apiKey:"REDACTED"', html)
            
            with open('scholar.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("Successfully saved scholar.html")
            return
            
        except Exception as e:
            print(f"Error fetching: {e}")
            if attempt < max_retries - 1:
                print("Waiting 10 seconds before retrying...")
                time.sleep(10)
            else:
                print("All attempts failed. Google Scholar is likely blocking the GitHub Actions IP.")
                # We exit with 1 so the workflow fails and we don't commit bad data
                sys.exit(1)

if __name__ == '__main__':
    fetch_scholar_html('a89cK-wAAAAJ')
