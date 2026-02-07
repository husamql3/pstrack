import { useRouteContext } from "@tanstack/react-router";

export function useAuth() {
	const context = useRouteContext({ from: "__root__" });

	return {
		user: context.user,
		session: context.session,
		isAuthenticated: !!context.session,
	};
}
