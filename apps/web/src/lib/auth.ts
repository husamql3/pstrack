import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
	baseURL: import.meta.env.VITE_BACKEND_URL + "/api/v3/auth",
});

export const getSession = async () => {
	const { data, error } = await auth.getSession();
	if (error || !data?.session) {
		return { session: null, user: null };
	}

	return {
		session: data.session,
		user: data.user,
	};
};

export const signOut = async () => {
	await auth.signOut();
};