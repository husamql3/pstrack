import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { api } from "@/lib/api"

export const Route = createFileRoute("/_admin/admin/emails")({
	component: AdminEmailsPage,
})

function AdminEmailsPage() {
	const queryClient = useQueryClient()
	const [selectedKey, setSelectedKey] = useState<string | null>(null)
	const [toUserId, setToUserId] = useState("")
	const [propsJson, setPropsJson] = useState("{}")

	const { data: templates, isLoading } = useQuery({
		queryKey: ["admin", "email-templates"],
		queryFn: async () => {
			const { data, error } = await api.v4.admin.emails.templates.get()
			if (error) throw new Error("Failed to load templates")
			return data
		},
		staleTime: Number.POSITIVE_INFINITY,
	})

	const selected = templates?.find((t) => t.key === selectedKey) ?? templates?.[0]
	if (selected && !selectedKey) setSelectedKey(selected.key)

	const handleLoadExample = () => {
		if (selected) setPropsJson(JSON.stringify(selected.exampleProps, null, 2))
	}

	const handleSend = async () => {
		if (!selected || !toUserId.trim()) return
		let props: Record<string, unknown>
		try {
			props = JSON.parse(propsJson) as Record<string, unknown>
		} catch {
			sileo.error({ title: "Invalid JSON in props" })
			return
		}
		await sileo.promise(
			api.v4.admin.emails.send.post({
				template: selected.key,
				toUserId: toUserId.trim(),
				props,
			}),
			{
				loading: { title: "Sending..." },
				success: { title: "Email sent" },
				error: (err) => ({
					title: "Failed",
					description: err instanceof Error ? err.message : "Try again",
				}),
			}
		)
		await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] })
	}

	return (
		<>
			<AdminPageHeader
				title="Emails"
				description="Manually send transactional emails for support / debugging"
			/>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Send one-off</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="template">Template</Label>
								<Select value={selectedKey ?? ""} onValueChange={setSelectedKey}>
									<SelectTrigger id="template">
										<SelectValue placeholder="Select template" />
									</SelectTrigger>
									<SelectContent>
										{templates?.map((t) => (
											<SelectItem key={t.key} value={t.key}>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="to-user">Recipient user ID</Label>
								<Input
									id="to-user"
									placeholder="user_xyz123"
									value={toUserId}
									onChange={(e) => setToUserId(e.target.value)}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="props">Props (JSON)</Label>
								<Button size="sm" variant="ghost" onClick={handleLoadExample}>
									Load example
								</Button>
							</div>
							<Textarea
								id="props"
								rows={8}
								className="font-mono text-xs"
								value={propsJson}
								onChange={(e) => setPropsJson(e.target.value)}
							/>
						</div>
						<Button
							onClick={handleSend}
							disabled={!selected || !toUserId.trim()}
							className="self-end"
						>
							Send
						</Button>
					</CardContent>
				</Card>
			)}
		</>
	)
}
