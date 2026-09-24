# BetterContact integration

## What was added

- A Super Admin tab named **BetterContact API** in the Admin Panel.
- A secure test form for first name, last name, company domain, optional LinkedIn URL, and phone/email mode.
- A server-side enrichment function that submits BetterContact's asynchronous request, waits for the terminal result, and returns the requested contact fields.
- The BetterContact key is stored as the encrypted project secret `BETTERCONTACT_API_KEY`. It is never sent to the browser or stored in a database table.

## How to use it

1. Open **Admin Panel** as a Super Admin.
2. Open the **BetterContact API** tab.
3. Enter first name, last name, and the company domain.
4. Add the LinkedIn URL when requesting a phone number; BetterContact documents it as the recommended identifier for phone enrichment.
5. Choose phone, email, or both, then click **Test BetterContact**.

## API behavior

BetterContact's contact enrichment endpoint is asynchronous. The server submits `POST /api/v2/async`, keeps the returned request ID, and polls `GET /api/v2/async/{request_id}` until the response status is `terminated`. A `202` response means the request is still processing, not that no contact was found.

The response mapping is:

- `contact_email_address` → Email
- `contact_phone_number` → Phone
- `contact_full_name` → Name
- `company_name` → Company
- `contact_job_title` → Title
- `contact_location_city` → City

Existing Lusha functionality was not changed. RTNE and CSV workflows remain unchanged in this first integration step.