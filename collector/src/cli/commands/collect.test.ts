import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgs } from '../../runtime/collect-command.js';

test('parseArgs enables force mode', () => {
	assert.deepEqual(parseArgs(['--force']), { force: true });
});

test('parseArgs defaults force to false', () => {
	assert.deepEqual(parseArgs([]), { force: false });
});

test('parseArgs rejects unknown options', () => {
	assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
});
