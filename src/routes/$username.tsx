import { createFileRoute } from "@tanstack/react-router"

import { RouteErrorFallback } from "@/components/route-error-fallback"
import {
	PublicProfile,
	PublicProfileNotFound,
	PublicProfileSkeleton,
} from "@/features/profile/components/public-profile"
import { usePublicProfile } from "@/features/profile/hooks/use-public-profile"
import { createSeoHead, siteUrl } from "@/lib/seo"

export const Route = createFileRoute("/$username")({
	ssr: true,
	component: PublicProfileRoute,
	errorComponent: ({ error, reset }) => (
		<RouteErrorFallback error={error} reset={reset} title="Could not load profile" />
	),
	head: ({ params }) =>
		createSeoHead({
			title: `${params.username} — LeetCode Accountability Profile`,
			description: `${params.username}'s LeetCode accountability profile on PStrack — solve streaks, points, badges, and group memberships.`,
			path: `/${params.username}`,
			schema: {
				"@context": "https://schema.org",
				"@type": "ProfilePage",
				url: `${siteUrl}/${params.username}`,
				name: `${params.username} on PStrack`,
				mainEntity: {
					"@type": "Person",
					name: params.username,
					url: `${siteUrl}/${params.username}`,
				},
			},
		}),
})

function PublicProfileRoute() {
	const { username } = Route.useParams()
	const { data, isLoading } = usePublicProfile(username)

	if (isLoading) return <PublicProfileSkeleton />
	if (!data) return <PublicProfileNotFound username={username} />
	return <PublicProfile profile={data} />
}
