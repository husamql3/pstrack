import { Button } from "@/components/ui/button"
import { SectionCard } from "../section-card"

export const DeleteAccountSection = () => (
	<SectionCard
		title="Delete account"
		description="Permanently remove your account, solves, points, and group memberships. This cannot be undone."
		badge="Coming soon"
		tone="danger"
	>
		<Button variant="destructive" size="sm" disabled>
			Delete my account
		</Button>
	</SectionCard>
)
