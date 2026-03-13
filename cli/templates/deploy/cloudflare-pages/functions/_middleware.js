const REALM = 'Restricted';

function unauthorized() {
	return new Response('Authentication required', {
		status: 401,
		headers: {
			'WWW-Authenticate': `Basic realm="${REALM}"`,
		},
	});
}

function decodeCredentials(header) {
	if (!header || !header.startsWith('Basic ')) {
		return null;
	}

	try {
		const decoded = atob(header.slice(6));
		const separator = decoded.indexOf(':');
		if (separator <= 0) {
			return null;
		}

		return {
			username: decoded.slice(0, separator),
			password: decoded.slice(separator + 1),
		};
	} catch {
		return null;
	}
}

async function sha256(value) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function safeEqual(left, right) {
	const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
	let diff = 0;

	for (let i = 0; i < leftHash.length; i += 1) {
		diff |= leftHash[i] ^ rightHash[i];
	}

	return diff === 0;
}

export async function onRequest(context) {
	const credentials = decodeCredentials(context.request.headers.get('Authorization'));
	if (!credentials) {
		return unauthorized();
	}

	const expectedPassword = context.env[`CLOUDFLARE_PW_${credentials.username}`];
	if (typeof expectedPassword !== 'string' || expectedPassword.length === 0) {
		return unauthorized();
	}

	if (!(await safeEqual(credentials.password, expectedPassword))) {
		return unauthorized();
	}

	return context.next();
}
