import ProUnlockedByAdminEmail from "@/emails/pro-unlocked-by-admin"
import { env } from "@/env"
import { sendEmail } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = (env.BETTER_AUTH_URL ?? "https://pstrack.localhost").replace(/\/$/, "")

const formatExpiry = (expiresAt: Date | null): string | null =>
	expiresAt?.toLocaleString("en-US", {
		timeZone: "UTC",
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}) ?? null

export const usersAdminNotifications = {
	proGranted: (email: string, name: string, expiresAt: Date | null): void => {
		sendEmail({
			from: env.EMAIL_FROM,
			to: email,
			subject: "You're a PStrack Pro user now",
			react: ProUnlockedByAdminEmail({
				name,
				dashboardUrl: `${BASE_URL}/dashboard`,
				expiresAt: formatExpiry(expiresAt),
			}),
		}).catch((err) => captureServerException(err, { tag: "email:pro-unlocked-admin" }))
	},
}
