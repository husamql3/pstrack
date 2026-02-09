import type { auth } from "@/lib/auth";

export type User = typeof auth.$Infer.Session.user | null;
export type Session = typeof auth.$Infer.Session.session | null;

export type AppType = {
	Variables: {
		user: User;
		session: Session;
	};
};

declare module "hono" {
	interface ContextVariableMap {
		user: User;
		session: Session;
	}
}
