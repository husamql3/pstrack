import { IconBrandGithub, IconBrandGoogle, IconMail } from "@tabler/icons-react"

import { Skeleton } from "@/components/ui/skeleton"
import { type LinkedAccount, useLinkedAccounts } from "../../hooks/use-accounts"
import { providerLabel } from "../../utils"
import { SectionCard } from "../section-card"

const iconFor = (providerId: string) => {
	if (providerId === "google") return IconBrandGoogle
	if (providerId === "github") return IconBrandGithub
	return IconMail
}

export const ProvidersSection = () => {
	const { data, isLoading } = useLinkedAccounts()

	return (
		<SectionCard
			title="Connected accounts"
			description="The providers you can use to sign in."
		>
			{isLoading && <Skeleton className="h-16 w-full" />}
			{!isLoading && (
				<ul className="flex flex-col gap-2">
					{(data ?? []).map((acc: LinkedAccount) => {
						const Icon = iconFor(acc.providerId)
						return (
							<li
								key={acc.id}
								className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
							>
								<Icon className="size-4 text-muted-foreground" aria-hidden="true" />
								<span className="font-medium text-sm">
									{providerLabel(acc.providerId)}
								</span>
							</li>
						)
					})}
					{(data ?? []).length === 0 && (
						<p className="text-muted-foreground text-sm">No linked providers found.</p>
					)}
				</ul>
			)}
		</SectionCard>
	)
}
