# Booqable to MailerLite Integration

This serverless application automatically adds new Booqable customers to your MailerLite mailing list.

## Features

- Listens for Booqable webhook events when new customers are created
- Automatically adds new customers to MailerLite
- Prevents duplicate subscribers
- Transfers customer details (name, company, phone) to MailerLite custom fields

## Setup

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set up environment variables in Vercel:
   - `MAILERLITE_API_KEY`: Your MailerLite API key
   - `BOOQABLE_API_KEY`: Your Booqable API key
   - `BOOQABLE_COMPANY`: Your Booqable company name

4. Configure Booqable webhook:
   - Go to your Booqable settings
   - Add a new webhook
   - Set the URL to your Vercel deployment URL + `/api/webhook`
   - Select the "Customer Created" event

## Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys for local development

3. Run locally:
```bash
vercel dev
```
