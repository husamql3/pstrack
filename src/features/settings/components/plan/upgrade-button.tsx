import { IconArrowUpRight } from "@tabler/icons-react"
import { useState } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { PRO_CHECKOUT_SLUG } from "@/features/settings/constants"
import { authClient } from "@/lib/auth-client"

// Kicks off the Better Auth Polar checkout for the Pro product. On success the
// browser is redirected to Polar's hosted checkout, so there is no "done" state
// to render — the button just stays disabled while we hand off.
export const UpgradeButton = () => {
	const [isRedirecting, setIsRedirecting] = useState(false)

	const handleUpgrade = async () => {
		setIsRedirecting(true)
		try {
			await sileo.promise(() => authClient.checkout({ slug: PRO_CHECKOUT_SLUG }), {
				loading: { title: "Starting checkout…" },
				success: { title: "Redirecting to Polar…" },
				error: (err) => ({
					title: "Couldn't start checkout",
					description: err instanceof Error ? err.message : "Please try again.",
				}),
			})
		} catch {
			// sileo already surfaced the error toast — re-enable the button.
			setIsRedirecting(false)
		}
	}

	return (
		<Button className="font-semibold" disabled={isRedirecting} onClick={handleUpgrade}>
			{isRedirecting ? "Redirecting…" : "Upgrade to Pro"}
			<IconArrowUpRight aria-hidden="true" />
		</Button>
	)
}
