import urllib.request

def fetch_scholar_html(scholar_id):
    url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        response = urllib.request.urlopen(req)
        import re
        # Google Scholar returns UTF-8 natively.
        html = response.read().decode('utf-8', errors='replace')
        
        # Remove any embedded Google API keys to avoid secret leakage
        html = re.sub(r'apiKey:"AIza[^"]+"', 'apiKey:"REDACTED"', html)
        
        with open('scholar.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Successfully saved scholar.html")
    except Exception as e:
        print(f"Error fetching: {e}")
        # If it fails, we don't overwrite the existing scholar.html so the site doesn't break
        import sys
        sys.exit(1)

if __name__ == '__main__':
    fetch_scholar_html('a89cK-wAAAAJ')
