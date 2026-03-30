# Google Sheets Setup Guide — SEO Quote Tool Config

## Step 1: Create the spreadsheet
1. Go to sheets.google.com
2. Create a new blank spreadsheet
3. Name it: "SEO Tool Config"
4. Share it: Click Share → Anyone with the link → Viewer
5. Copy the Sheet ID from the URL:
   https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit

## Step 2: Create 3 tabs with this exact structure

---

### TAB 1: Name it "defaults"

| Setting | Value |
|---|---|
| Target Margin % | 40 |
| Value Share % Min | 10 |
| Value Share % Max | 20 |
| Default Conv Rate % | 2.5 |

---

### TAB 2: Name it "tier_costs"

| Tier | Min Price | Max Price | Delivery Cost |
|---|---|---|---|
| Basic | 499 | 999 | 250 |
| Intermediate | 1099 | 1499 | 450 |
| Advanced | 1599 | 2099 | 700 |
| Pro | 2199 | 3000 | 1100 |
| Enterprise | 3000 | | 1800 |

Note: Leave Max Price blank for Enterprise

---

### TAB 3: Name it "industry_benchmarks"

| Industry | YMYL (Yes/No) | Close Rate % | Avg Sale Value $ | Conv Rate % |
|---|---|---|---|---|
| Plumber | No | 35 | 850 | 3 |
| Electrician | No | 40 | 950 | 3 |
| Builder | No | 25 | 45000 | 1.5 |
| Roofer | No | 30 | 8000 | 2 |
| Landscaper | No | 35 | 3500 | 2.5 |
| Painter | No | 40 | 2500 | 3 |
| Concreter | No | 35 | 4500 | 2.5 |
| Carpenter | No | 40 | 3000 | 2.5 |
| Tiler | No | 40 | 2000 | 3 |
| Cleaner | No | 50 | 250 | 4 |
| Removalist | No | 45 | 1200 | 3.5 |
| Mechanic | No | 55 | 600 | 4 |
| Pest Control | No | 50 | 350 | 4 |
| Locksmith | No | 60 | 250 | 5 |
| Air Conditioning | No | 40 | 3500 | 3 |
| Solar | No | 25 | 12000 | 2 |
| Pool Builder | No | 20 | 55000 | 1.5 |
| Dentist | Yes | 60 | 500 | 5 |
| Physiotherapist | Yes | 65 | 120 | 5.5 |
| Chiropractor | Yes | 60 | 100 | 5 |
| Psychologist | Yes | 55 | 200 | 4.5 |
| GP / Doctor | Yes | 70 | 80 | 6 |
| Lawyer | Yes | 25 | 8000 | 2 |
| Accountant | Yes | 35 | 3500 | 3 |
| Financial Planner | Yes | 30 | 5000 | 2.5 |
| Mortgage Broker | Yes | 35 | 3000 | 3 |
| Real Estate Agent | No | 20 | 18000 | 1.5 |
| Vet | Yes | 65 | 350 | 5 |
| Optometrist | Yes | 70 | 400 | 5.5 |
| Restaurant | No | 70 | 80 | 6 |
| Cafe | No | 75 | 30 | 7 |
| Gym / Fitness | No | 40 | 1200 | 3.5 |
| Personal Trainer | No | 45 | 800 | 4 |
| Tutor | No | 50 | 600 | 4.5 |
| Wedding Photographer | No | 35 | 3500 | 3 |
| Florist | No | 55 | 250 | 5 |
| Driving School | No | 55 | 600 | 4.5 |

---

## Step 3: Get your Google Sheets API key
1. Go to console.cloud.google.com
2. Create a new project: "SEO Quoting Tool"
3. Enable APIs: search "Google Sheets API" → Enable
4. Go to Credentials → Create Credentials → API Key
5. Click Restrict Key → API restrictions → Google Sheets API
6. Copy the key

## Step 4: Add to your .env file
REACT_APP_SHEETS_API_KEY=your_api_key_here
REACT_APP_SHEET_ID=your_sheet_id_here

Once connected, the app will load live benchmarks from Sheets on every page load.
The SEO team can edit the spreadsheet at any time — changes take effect immediately.
