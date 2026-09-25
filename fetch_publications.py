import urllib.request
import re
from bs4 import BeautifulSoup
import json

def fetch_scholar_data(scholar_id):
    url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100"
    import urllib.parse
    proxy_url = f"https://corsproxy.io/?{urllib.parse.quote(url)}"
    req = urllib.request.Request(proxy_url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching: {e}")
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    rows = soup.select('#gsc_a_b .gsc_a_tr')
    
    publications = []
    
    for row in rows:
        title_el = row.select_one('.gsc_a_at')
        if not title_el:
            continue
            
        title = title_el.text.strip()
        link = "https://scholar.google.com" + title_el['href']
        
        gray_els = row.select('.gs_gray')
        authors = gray_els[0].text.strip() if len(gray_els) > 0 else ""
        venue = gray_els[1].text.strip() if len(gray_els) > 1 else ""
        
        year_el = row.select_one('.gsc_a_y .gsc_a_h')
        year = year_el.text.strip() if year_el else ""
        
        publications.append({
            "title": title,
            "authors": authors,
            "venue": venue,
            "year": year,
            "scholar_link": link
        })
        
    return publications

if __name__ == '__main__':
    pubs = fetch_scholar_data('a89cK-wAAAAJ')
    with open('publications.json', 'w', encoding='utf-8') as f:
        json.dump(pubs, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(pubs)} publications.")
