/**
 * These command modules are shipped directly via package exports without a
 * separate package build step, so they intentionally stay in plain ESM.
 *
 * @param {unknown} error
 * @returns {number}
 */
export function getExitCode(error) {
	return typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
		? error.status
		: 1;
}
