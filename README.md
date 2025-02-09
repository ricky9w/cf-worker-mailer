# Cloudflare Worker Mailer

## Prerequisites

Ensure you have the following prerequisites in place:

- **Correctly Configured Cloudflare Email Routing**

​	You must have Cloudflare Email Routing set up for the domain to send emails.

- **Verified Destination Email Address**

    You should have at least one verified email address configured as a destination in your Cloudflare Email Routing setup.

## Deployment Steps

1. Fork this repository

2. Configure `wrangler.toml`:

    - `name`: Use the default name or change it to your desired worker name.
    - `send_email.destination_address`: Make sure the email here is verified in Email Routing. The worker is only allow to send emails to this address.
    - `[vars].SENDER_NAME`: The sender name that will appear in the "FROM" field of the emails (e.g., "Your Application Notifier").
    - `[vars].SENDER_EMAIL`: The sender email address. You need to configure Email Routing for the domain of this address before you can send emails from it.
    - `[vars].PATH_NAME`: The API endpoint path for sending emails (defaults to `/send`). You can change this if needed.

3. Create a Cloudflare Worker and Connect to GitHub:

    Recommended, but not necessary. You can always deploy your worker with `wrangler`.

4. Add the API_KEY Secret:

    In your Cloudflare Worker dashboard, go to "Settings - Variables and Secrets" and add the `API_KEY` secret.

## Usage

To send an email, make a POST request to your deployed Cloudflare Worker URL.

**Request Example (curl):**

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "recipient@example.com",
    "subject": "Test Email from cf-worker-mailer",
    "data": {
      "event": "Example Event",
      "trigger": "API Call"
    }
  }' \
  https://<YOUR_WORKER_DOMAIN>.workers.dev/<PATH_NAME>
```

## API Reference

**Endpoint:**

POST `<your-worker-domain>/<PATH_NAME>`

**Headers:**

Authorization: Bearer <API_KEY> - Required: yes

**Body (JSON):**

```json
{
  "recipient": "recipient@example.com",
  "subject": "Your Email Subject",
  "data": { "key1": "value1", "key2": "value2" }
}
```

recipient - String (Required): The email address of the recipient.

subject - String (Required): The subject of the email.

data - Object (Optional): Key-value pairs to include in the email body.

**Response (JSON):**

- Success (200 OK):

    ```json
    { "success": true, "message": "Email sent successfully" }
    ```

- Error (4xx/5xx):

    ```json
    { "error": "<ErrorType>", "message": "<ErrorMessage>" }
    ```

## Customization

You can easily customize the format and content of the emails sent by modifying the `buildEmailMessage` function in `src/index.ts`.

You can even explore opitons like:

- Email Templates: Use templates to create more structured and dynamic email content.

- Email Libraries: Libraries like [react-email](https://github.com/resend/react-email) can help you build rich HTML emails using familiar component-based approaches. You would need to adapt the `buildEmailMessage` function to generate HTML content and set the appropriate `Content-Type` in `msg.addMessage`.

## Reference

[Send emails from Workers · Cloudflare Email Routing docs](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)

[Cloudflare Email Routing · Cloudflare Email Routing docs](https://developers.cloudflare.com/email-routing/)