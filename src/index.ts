/**
 * Cloudflare Worker Mailer
 * 
 * This worker listens for API requests and sends emails using Cloudflare Email Routing
 * 
 * - Configure environment variables in `wrangler.toml`
 * - Set API_KEY secret using `wrangler` or via dashboard
 * - Deploy the worker
 * 
 * Endpoint: `POST <your-worker-domain>/<PATH_NAME>` (PATH_NAME is configured in wrangler.toml, defaults to `/send`)
 * 
 * Headers:
 *  - `Authorization: Bearer <API_KEY>`
 *    - required: yes
 * Body (JSON):
 * ```json
 *  {
 *    "recipient": "recipient@example.com",
 *    "subject": "Your Email Subject",
 *    "data": {
 *      "key1": "value1",
 *      "key2": "value2",
 *      // ... more data
 *    }
 *  }
 *  ```
 *  - `recipient` - string (required)
 *  - `subject`   - string (required)
 *  - `data`      - object (optional)
 */

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage, MIMEMessage } from "mimetext/browser";

export interface Env {
	CF_MAILER: SendEmail;
	SENDER_NAME: string;
	SENDER_EMAIL: string;
	PATH_NAME: string;
	API_KEY: string;
}

interface EmailRequestBody {
	recipient: string;
	subject: string;
	data?: Record<string, any>;
}

function buildEmailMessage(senderName: string, senderEmail: string, requestBody: EmailRequestBody): MIMEMessage {
	const msg = createMimeMessage();
	msg.setSender({ name: senderName, addr: senderEmail });
	msg.setRecipient(requestBody.recipient);
	msg.setSubject(requestBody.subject);

	let emailBody = `
		Notification Email from Your Service

		${requestBody.data ? Object.entries(requestBody.data).map(([key, value]) => `${key}: ${value}`).join('\n') : 'No data provided.'}
	`

	msg.addMessage({
		contentType: 'text/plain',
		data: emailBody
	});

	return msg;
}

export default {
	async fetch (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'POST' || new URL(request.url).pathname !== env.PATH_NAME) {
			return new Response(JSON.stringify({ 
				error: 'Invalid request',
				message: `Please send a POST request to ${env.PATH_NAME}`
			}), { 
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const apiKey = request.headers.get('Authorization')?.split(' ')[1];
		if (!apiKey || apiKey !== env.API_KEY) {
			return new Response(JSON.stringify({
				error: 'Unauthorized',
				message: 'Invalid or missing API Key'
			}), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		try {
			const requestBody = await request.json<EmailRequestBody>();
			
			const { SENDER_NAME: senderName, SENDER_EMAIL: senderEmail } = env;
			const recipientEmail = requestBody.recipient;
			
			const msg = buildEmailMessage(senderName, senderEmail, requestBody);

			const message = new EmailMessage(
				senderEmail,
				recipientEmail,
				msg.asRaw()
			);

			await env.CF_MAILER.send(message);

			return new Response(JSON.stringify({
				success: true,
				message: 'Email sent successfully'
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});

		} catch (error: any) {
			console.error('Error sending email:', error);
			return new Response(JSON.stringify({
				error: 'Failed to send email',
				message: error.message
			}), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}
} satisfies ExportedHandler<Env>;
