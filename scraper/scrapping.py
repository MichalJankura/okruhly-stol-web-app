import psycopg2
import requests
import re
from bs4 import BeautifulSoup
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time

def create_session_with_retries():
    session = requests.Session()
    retry_strategy = Retry(
        total=3,  # number of retries
        backoff_factor=1,  # wait 1, 2, 4 seconds between retries
        status_forcelist=[500, 502, 503, 504]  # HTTP status codes to retry on
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def geocode_location(location):
    try:
        url = f"https://nominatim.openstreetmap.org/search"
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        headers = {"User-Agent": "okruhly-stol-app"}
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Error geocoding {location}: {e}")
    return None, None

conn = psycopg2.connect(
    dbname="neondb",
    user="neondb_owner",
    password="npg_kJ8ETa7rsSdG",
    host="ep-super-sea-a9w53jra-pooler.gwc.azure.neon.tech",
    port=""
)
c = conn.cursor()

def parse_single_date(date_str):
    month_abbr = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'máj': 5, 'maj': 5, 'jun': 6,
        'júl': 7, 'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
        'január': 1, 'február': 2, 'marec': 3, 'apríl': 4, 'máj': 5, 'jún': 6,
        'júl': 7, 'august': 8, 'september': 9, 'október': 10, 'november': 11, 'december': 12
    }
    parts = date_str.strip().split()
    if len(parts) == 3:
        day = int(parts[0])
        month = month_abbr.get(parts[1].lower())
        year = int(parts[2])
        if month:
            try:
                return datetime(year, month, day)
            except ValueError:
                return None
    return None

def parse_date(date_input):
    date_input = date_input.strip()
    if " - " in date_input:
        start_date, end_date = date_input.split(" - ")
        start_parts = start_date.strip().split()
        end_parts = end_date.strip().split()
        if len(end_parts) < 2:
            start_parts = start_date.split(".")
            end_parts = end_date.split(".")
        if len(start_parts) > 1:
            start_day=start_parts[0]
            end_day = end_parts[0]
            month_start = start_parts[1]
            month_end = end_parts[1]
            year = end_parts[2]
            start_parsed = datetime(int(year), int(month_start), int(start_day))
            end_parsed = datetime(int(year), int(month_end), int(end_day))
        else:
            start_day = start_parts[0]
            end_day = end_parts[0]
            month = end_parts[1]
            year = end_parts[2]
            start_date = f"{start_day} {month} {year}"
            start_parsed = parse_single_date(start_date)
            end_parsed = parse_single_date(f"{end_day} {month} {year}")
        if start_parsed and end_parsed:
            return f"{start_parsed.strftime('%d.%m.%Y')} - {end_parsed.strftime('%d.%m.%Y')}"
        else:
            return f"Error: Invalid date range format '{date_input}'"
    else:
        parsed_date = parse_single_date(date_input)
        if parsed_date:
            return parsed_date.strftime('%d.%m.%Y')
        else:
            start_date = date_input.split(".")
            if len(start_date) > 1:
                start_day = start_date[0]
                month = start_date[1]
                start_parsed = datetime(2025, int(month), int(start_day))
                return start_parsed.strftime('%d.%m.%Y')
            else:
                return f"Error: Invalid date format '{date_input}'"

def is_valid_date(date_input):
    current_date = datetime.today()
    if ' - ' in date_input:
        start_date_str, end_date_str = date_input.split(' - ')
        end_date = datetime.strptime(end_date_str, "%d.%m.%Y")
        return end_date >= current_date
    try:
        single_date = datetime.strptime(date_input, "%d.%m.%Y")
        return single_date >= current_date
    except ValueError:
        return False

def clean_old_events():
    with conn.cursor() as cur:
        today = datetime.today().strftime("%Y-%m-%d")
        cur.execute(
            '''DELETE FROM events 
               WHERE (event_end_date IS NOT NULL AND event_end_date < %s)
               OR (event_end_date IS NULL AND event_start_date < %s)''',
            (today, today)
        )
        conn.commit()
        print(f"Old events have been cleaned up.")

def push_event_to_db(events_data):
    with conn.cursor() as cur:
        today = datetime.today().date()  # Get today's date as datetime.date object
        for event in events_data:
            title, event_type, event_location, start_date, end_date, start_time, end_time, tickets, description, link_to, image_url, latitude, longitude = event
            
            # Convert dates from dd.mm.yyyy to yyyy-mm-dd format
            if start_date:
                start_date = datetime.strptime(start_date, "%d.%m.%Y").strftime("%Y-%m-%d")
            if end_date:
                end_date = datetime.strptime(end_date, "%d.%m.%Y").strftime("%Y-%m-%d")
            
            # Skip events with dates older than today
            if start_date and datetime.strptime(start_date, "%Y-%m-%d").date() < today:
                continue
            if end_date and datetime.strptime(end_date, "%Y-%m-%d").date() < today:
                continue

            # Check for existing events with same title and type
            cur.execute(
                '''SELECT event_start_date, event_end_date FROM events 
                   WHERE title = %s AND event_type = %s''',
                (title, event_type)
            )
            existing_events = cur.fetchall()

            if existing_events:
                # Find earliest start date and latest end date
                all_dates = []
                for existing_start, existing_end in existing_events:
                    if existing_start and existing_start >= today:
                        all_dates.append(existing_start)
                    if existing_end and existing_end >= today:
                        all_dates.append(existing_end)
                
                if start_date:
                    start_date_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
                    if start_date_dt >= today:
                        all_dates.append(start_date_dt)
                if end_date:
                    end_date_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
                    if end_date_dt >= today:
                        all_dates.append(end_date_dt)

                if all_dates:  # Only update if we have valid future dates
                    earliest_date = min(all_dates).strftime("%Y-%m-%d")
                    latest_date = max(all_dates).strftime("%Y-%m-%d")

                    # Update the first matching event with new dates and location coordinates
                    cur.execute(
                        '''UPDATE events 
                           SET event_start_date = %s, 
                               event_end_date = %s,
                               latitude = %s,
                               longitude = %s
                           WHERE id = (
                               SELECT id FROM events 
                               WHERE title = %s AND event_type = %s
                               ORDER BY id
                               LIMIT 1
                           )''',
                        (earliest_date, latest_date, latitude, longitude, title, event_type)
                    )
            else:
                # No matching events found, insert new event with location coordinates
                cur.execute(
                    '''INSERT INTO events (
                        title, event_type, location, event_start_date, event_end_date, 
                        start_time, end_time, tickets, description, link_to, image_url,
                        latitude, longitude
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                    (title, event_type, event_location, start_date, end_date, start_time, 
                     end_time, tickets, description, link_to, image_url, latitude, longitude)
                )
        conn.commit()
    print(f'{len(events_data)} podujatí bolo spracovaných.')

def sl_scrap():
    url = 'https://www.staralubovna.sk/kalendar-podujati/all/'
    url_event = 'https://www.staralubovna.sk/'
    session = create_session_with_retries()
    events_data = []
    try:
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            events = soup.find_all('h2', class_='media-heading')
            for event in events[1:]:
                try:
                    a_tag = event.find('a')
                    if a_tag and a_tag.get('href'):
                        href = a_tag.get('href')
                        response = session.get(f'{url_event}{href}', timeout=10)
                        link_to = f'{url_event}{href}'
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.content, 'html.parser')
                            event_detail = soup.find('div', class_='event-detail')
                            if event_detail:
                                title_div = event_detail.find('div', class_='event-title')
                                title = title_div.find('h2').text.strip() if title_div else 'Názov neznámy'
                                event_type = event_detail.find('dt', string='Typ podujatia:').find_next('dd').text.strip() if event_detail.find('dt', string='Typ podujatia:') else 'Typ neznámy'
                                event_location = event_detail.find('dt', string='Miesto podujatia:').find_next('dd').text.strip() if event_detail.find('dt', string='Miesto podujatia:') else 'Miesto neznáme'
                                
                                # Geocode the location
                                latitude, longitude = geocode_location(event_location)
                                
                                event_date_raw = event_detail.find('dt', string='Dátum konania:').find_next('dd').text.strip() if event_detail.find('dt', string='Dátum konania:') else 'Dátum neznámy'
                                date_matches = re.findall(r'(\d{2}\.\d{2}\.\d{4})', event_date_raw)
                                start_date, end_date = None, None
                                if len(date_matches) > 0:
                                    start_date = date_matches[0]
                                    if len(date_matches) > 1:
                                        end_date = date_matches[1]
                                event_time_raw = event_detail.find('dt', string='Čas:').find_next('dd').text.strip() if event_detail.find('dt', string='Čas:') else 'Čas neznámy'
                                match = re.search(r'(\d{1,2})[.:](\d{2})', event_time_raw)
                                start_time = f"{match.group(1)}:{match.group(2)}" if match else None
                                end_time=None
                                tickets = event_detail.find('dt', string='Vstupné:').find_next('dd').text.strip() if event_detail.find('dt', string='Vstupné:') else 'Vstupné neznáme'
                                description = event_detail.find('div', class_='event-desc').p.text.strip() if event_detail.find('div', class_='event-desc') else 'Popis neznámy'
                                image_url = None
                                event_desc_div = soup.find('div', class_='event-desc')
                                img_tag = event_desc_div.find('img')
                                if img_tag and img_tag.get('src'):
                                    image_url_part1 = img_tag['src']
                                    image_url = f'{url_event}{image_url_part1}'
                                events_data.append((title, event_type, event_location, start_date, end_date, start_time, end_time, tickets, description, link_to, image_url, latitude, longitude))
                except Exception as e:
                    print(f"Error processing event in sl_scrap: {e}")
                    continue
    except Exception as e:
        print(f"Error in sl_scrap: {e}")
    return events_data

def gopresov_scrap():
    url = 'https://www.gopresov.sk/podujatia/kalendar-podujati/'
    session = create_session_with_retries()
    events_data = []
    try:
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            events = soup.find_all('h4', class_='mec-event-title')
            for event in events:
                try:
                    a_tag = event.find('a')
                    if a_tag and a_tag.get('href'):
                        href = a_tag.get('href')
                        link_to = href
                        date_match = re.search(r'occurrence=(\d{4}-\d{2}-\d{2})$', href)
                        if date_match:
                            event_date = datetime.strptime(date_match.group(1), '%Y-%m-%d')
                            if event_date < datetime.today():
                                continue
                        response = session.get(href, timeout=10)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.content, 'html.parser')
                            event_date_unformatted = soup.find('span', class_ = 'mec-start-date-label').text.strip() if soup.find('span', class_ = 'mec-start-date-label') else 'Dátum neznámy'
                            event_date_raw = parse_date(event_date_unformatted)
                            if not is_valid_date(event_date_raw):
                                continue
                            date_matches = re.findall(r'(\d{2}\.\d{2}\.\d{4})', event_date_raw)
                            start_date, end_date = None, None
                            if len(date_matches) > 0:
                                start_date = date_matches[0]
                                if len(date_matches) > 1:
                                    end_date = date_matches[1]
                            title = soup.find('h1', class_='mec-single-title').text.strip() if soup.find('h1', class_='mec-single-title') else 'Názov neznámy'
                            description = soup.find('div', class_='mec-single-event-description').text.strip() if soup.find('div', class_='mec-single-event-description') else 'Popis neznámy'
                            event_time_div = soup.find('div', class_ = 'mec-single-event-time')
                            if event_time_div:
                                event_time = event_time_div.find('abbr', class_ = 'mec-events-abbr').text.strip() if soup.find('abbr', class_ = 'mec-events-abbr') else 'Čas neznámy'
                                if ' - ' in event_time:
                                    start_time, end_time = event_time.split(' - ')
                                else:
                                    if re.match(r'^\d{1,2}:\d{2}$', event_time):
                                        start_time = event_time
                                    else:
                                        start_time = None
                                    end_time = None
                            else:
                                start_time = None
                                end_time = None
                            event_location = soup.find('span', class_ = 'mec-address').text.strip() if soup.find('span', class_ = 'mec-address') else 'Miesto neznáme'
                            
                            # Geocode the location
                            latitude, longitude = geocode_location(event_location)
                            
                            event_type_element= soup.find('dd', class_ ='mec-events-event-categories')
                            if event_type_element:
                                event_type = event_type_element.find('a').text.strip() if event_type_element.find('a') else 'Kategória neznáma'
                            else:
                                event_type = 'Kategória neznáma'
                            tickets = 'Vstupné neznáme'
                            image_url = None
                            img_div = soup.find('div', class_='mec-events-event-image')
                            if img_div:
                                img_tag = img_div.find('img')
                                if img_tag and img_tag.get('src'):
                                    image_url = img_tag['src']
                            events_data.append((title, event_type, event_location, start_date, end_date, start_time, end_time, tickets, description, link_to, image_url, latitude, longitude))
                except Exception as e:
                    print(f"Error processing event in gopresov_scrap: {e}")
                    continue
    except Exception as e:
        print(f"Error in gopresov_scrap: {e}")
    return events_data

def extract_info_from_date(date_div):
    spans = date_div.find_all('span', class_='ct-span')
    if len(spans)==1:
        return spans[0].text, 'Čas neznámy'
    elif  ':' in spans[1].text:
        start_date = spans[0].text.strip()
        event_time = spans[1].text.strip()
        return start_date, event_time
    elif len(spans)==2:
        start_date = spans[0].text.strip()
        end_date = spans[1].text.strip()
        return f"{start_date} - {end_date}", 'Čas neznámy'

def severovychod_scrap():
    url = 'https://www.severovychod.sk/podujatia/'
    session = create_session_with_retries()
    events_data = []
    try:
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            events = soup.find_all('a',class_ ='ct-link side-slider-slide-link')
            for event in events[1:]:
                event_location = event.find('div',class_='ct-text-block event-card-venue-txt').text.strip()
                
                # Geocode the location
                latitude, longitude = geocode_location(event_location)
                
                href = event.get('href')
                response = session.get(href, timeout=10)
                link_to = href
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content,'html.parser')
                    title = soup.find('span', class_='ct-span').text.strip() if soup else 'Názov neznámy'
                    event_type_div = soup.find('div', class_='ct-text-block single-poi-tag')
                    if event_type_div:
                        event_types = [a.text.strip() for a in event_type_div.find_all('a')]
                        event_type = ', '.join(event_types) if event_types else 'Typ neznámy'
                    else:
                        event_type = 'Typ neznámy'
                    date_div_first = soup.find('div', class_='single-poi-tag-date')
                    date_div_second = date_div_first.find_next('div', class_='single-poi-tag-date') if date_div_first else None
                    date_div = date_div_second if date_div_second else date_div_first
                    if date_div:
                        event_date_raw, event_time = extract_info_from_date(date_div)
                    else:
                        event_date, event_time = None, None
                    if not is_valid_date(event_date_raw):
                        continue
                    date_matches = re.findall(r'(\d{2}\.\d{2}\.\d{4})', event_date_raw)
                    start_date, end_date = None, None
                    if ' - ' in event_time:
                        start_time, end_time = event_time.split(' - ')
                    else:
                        if re.match(r'^\d{1,2}:\d{2}$', event_time):
                            start_time = event_time
                        else:
                            start_time = None
                        end_time = None
                    if len(date_matches) > 0:
                        start_date = date_matches[0]
                        if len(date_matches) > 1:
                            end_date = date_matches[1]
                    description = soup.find('div',class_='ct-inner-content').text.strip()
                    description = re.sub(r'\s+', ' ', description)
                    tickets = 'Vstupné neznáme'
                    image_url = None
                    figure_tag = soup.find('figure', class_='wp-block-image size-large')
                    if not figure_tag:
                        figure_tag = soup.find('figure', class_='wp-block-image size-full')
                        if not figure_tag:
                            figure_tag = soup.find('figure', class_='aligncenter size-large')
                    if figure_tag:
                        img_tag = figure_tag.find('img')
                        if img_tag and img_tag.get('src'):
                            image_url = img_tag['src']
                            if "data:image/svg+xml" in image_url:
                                if img_tag.get('data-lazy-src'):
                                    image_url = img_tag['data-lazy-src']
                    
                    # Extract time from description
                    time_matches = re.findall(r'\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b', description)
                    if time_matches:
                        time_str = time_matches[-1]  # Get the last time found
                        # Ensure the time is in HH:MM format
                        if ':' not in time_str:
                            time_str = f"{time_str}:00"
                        start_time = time_str
                        end_time = None
                    else:
                        start_time = None
                        end_time = None
                    
                    events_data.append((title, event_type, event_location, start_date, end_date, start_time, end_time, tickets, description, link_to, image_url, latitude, longitude))
    except Exception as e:
        print(f"Error in severovychod_scrap: {e}")
    return events_data

def ajdnes_scrap():
    url = 'https://www.ajdnes.sk/presovsky-kraj/r3'
    url_event = 'https://www.ajdnes.sk/'
    session = create_session_with_retries()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,sk;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    }
    events_data = []
    page = 1
    
    while True:
        try:
            current_url = url if page == 1 else f"{url}/page:{page}"
            response = session.get(current_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f'Error loading page {page}. Status code: {response.status_code}')
                break
            
            soup = BeautifulSoup(response.content, 'html.parser')
            events = soup.find_all('div', class_='col-sm-9 inf')
            
            if not events:  # If no events found on this page, we've reached the end
                break
            
            for event in events:
                try:
                    a_tag = event.find('a')
                    if a_tag and a_tag.get('href'):
                        href = a_tag.get('href')
                        response = session.get(f'{url_event}{href}', headers=headers, timeout=10)
                        link_to = f'{url_event}{href}'
                        # print(link_to)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.content, 'html.parser')
                            title = soup.find('h1').text.strip() if soup else 'Názov neznámy'
                            event_type = soup.find('div', class_='cat geC').text.strip() if soup else 'Typ neznámy'
                            location_div = soup.find('div', class_='loc mid')
                            if location_div:
                                venue = location_div.find('a').text.strip() if location_div.find('a') else ''
                                city = location_div.find_all('a')[1].text.strip() if len(location_div.find_all('a')) > 1 else ''
                                event_location = f"{venue}, {city}" if venue and city else venue or city or 'Miesto neznáme'
                                latitude, longitude = geocode_location(event_location)
                            else:
                                event_location = 'Miesto neznáme'
                                latitude, longitude = None, None
                            
                            date_div = soup.find('div', class_='dat')
                            if date_div:
                                date_links = date_div.find_all('a')
                                if len(date_links) == 2:
                                    start_date = date_links[0].text.strip()
                                    end_date = date_links[1].text.strip()
                                    start_date = datetime.strptime(start_date, '%d.%m.%Y').strftime('%d.%m.%Y')
                                    end_date = datetime.strptime(end_date, '%d.%m.%Y').strftime('%d.%m.%Y')
                                else:
                                    start_date = date_links[0].text.strip()
                                    start_date = datetime.strptime(start_date, '%d.%m.%Y').strftime('%d.%m.%Y')
                                    end_date = None
                            else:
                                start_date = None
                                end_date = None
                            
                            tickets = None
                            image_div = soup.find('div', class_='webp lazy')
                            if image_div:
                                img_link = image_div.find('a')
                                if img_link and img_link.get('href'):
                                    image_url = f"{url_event}{img_link['href']}"
                                else:
                                    image_url = None
                            else:
                                image_url = None
                            
                            desc_div = soup.find('div', class_='desc')
                            if desc_div:
                                description = desc_div.get_text(separator=' ', strip=True)
                                description = ' '.join(description.split())
                            else:
                                description = 'Popis neznámy'
                            
                            # Extract time from description
                            time_matches = re.findall(r'\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b', description)
                            if time_matches:
                                time_str = time_matches[-1]  # Get the last time found
                                # Ensure the time is in HH:MM format
                                if ':' not in time_str:
                                    time_str = f"{time_str}:00"
                                start_time = time_str
                                end_time = None
                            else:
                                start_time = None
                                end_time = None
                            
                            events_data.append((title, event_type, event_location, start_date, end_date, start_time, end_time, tickets, description, link_to, image_url, latitude, longitude))
                
                except Exception as e:
                    print(f"Error processing event in ajdnes_scrap: {e}")
                    continue
        
            # Check if there's a next page
            next_page = soup.find('a', string=str(page + 1))
            if not next_page:
                break
            
            page += 1
            time.sleep(1)  # Add a small delay between pages
        
        except Exception as e:
            print(f"Error in ajdnes_scrap on page {page}: {e}")
            break
    
    return events_data

def scrape_for_events():
    clean_old_events()  # Clean up old events before scraping
    
    try:
        events1 = sl_scrap()
        if events1:
            push_event_to_db(events1)
    except Exception as e:
        print(f"Error processing staralubovna.sk events: {e}")
    
    try:
        events2 = gopresov_scrap()
        if events2:
            push_event_to_db(events2)
    except Exception as e:
        print(f"Error processing gopresov.sk events: {e}")
    
    try:
        events3 = severovychod_scrap()
        if events3:
            push_event_to_db(events3)
    except Exception as e:
        print(f"Error processing severovychod.sk events: {e}")
    
    try:
        events4 = ajdnes_scrap()
        if events4:
            push_event_to_db(events4)
    except Exception as e:
        print(f"Error processing ajdnes.sk events: {e}")

if __name__ == "__main__":
    try:
        scrape_for_events()
    except Exception as e:
        print(f"Error in main scraping process: {e}")
    finally:
        conn.close()
