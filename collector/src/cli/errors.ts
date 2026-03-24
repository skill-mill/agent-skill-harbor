export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function getErrorExitCode(error: unknown): number {
	if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
		return error.status;
	}
	return 1;
}

export function logCliErrorAndExit(error: unknown): never {
	const message = getErrorMessage(error);
	if (message) {
		console.error(`Error: ${message}`);
	}
	process.exit(getErrorExitCode(error));
}
