import { listDocs } from '$lib/server/docs';

export const load = () => {
	return { docs: listDocs() };
};
