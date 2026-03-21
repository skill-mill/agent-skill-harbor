export async function onRequest(context) {
	const response = await context.next();

	const headers = new Headers(response.headers);
	headers.set('X-Robots-Tag', 'noindex');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
