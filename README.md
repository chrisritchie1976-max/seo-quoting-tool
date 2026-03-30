# SEO Quote Generator

Internal tool for generating SEO pricing quotes based on real Ahrefs keyword data.

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Set up n8n workflow using `n8n-workflow.json`
3. Set up Google Sheets using `GOOGLE_SHEETS_SETUP.md`

## Tech Stack
- React (Create React App)
- Ahrefs API v3 (via n8n)
- Claude API (via n8n — for Metro/Regional, YMYL, benchmarks)
- Google Sheets API (for editable config)
- Vercel (hosting)

## Environment Variables
- `REACT_APP_N8N_WEBHOOK_URL` — your n8n webhook endpoint
- `REACT_APP_SHEETS_API_KEY` — Google Sheets read-only API key
- `REACT_APP_SHEET_ID` — Google Sheet ID from the URL
