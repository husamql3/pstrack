import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import {
	useAdminUser,
	useAdminUserPointsHistory,
} from "@/features/admin/hooks/use-admin-users"
import { api } from "@/lib/api"
import { adminAdjustPointsSchema, adminProGrantSchema } from "@/server/admin/admin.type"

export const Route = createFileRoute("/_admin/admin/users/$id")({
	component: AdminUserDetailPage,
})

function AdminUserDetailPage() {
	const { id } = Route.useParams()
	const { data: user, isLoading } = useAdminUser(id)

	if (isLoading) {
		return (
			<>
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-64 w-full" />
			</>
		)
	}
	if (!user) return null

	return (
		<>
			<AdminPageHeader
				title={`@${user.username ?? user.id}`}
				description={user.email}
				actions={
					<Button asChild variant="outline" size="sm">
						<Link to="/admin/users">Back</Link>
					</Button>
				}
			/>

			<div className="flex flex-wrap items-center gap-2">
				{user.banned ? <Badge variant="destructive">banned</Badge> : null}
				{user.isPro ? <Badge>pro ({user.proSource ?? "?"})</Badge> : null}
				{user.role === "admin" ? <Badge variant="secondary">admin</Badge> : null}
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="points">Points</TabsTrigger>
					<TabsTrigger value="pro">Pro</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-2 gap-4 text-sm">
							<Field label="Name" value={user.name} />
							<Field label="Username" value={user.username} />
							<Field label="LeetCode" value={user.leetcodeHandle} />
							<Field label="Codeforces" value={user.codeforcesHandle} />
							<Field label="Total points" value={user.totalPoints.toLocaleString()} />
							<Field label="Current streak" value={user.currentStreak} />
							<Field label="Longest streak" value={user.longestStreak} />
							<Field label="Created" value={new Date(user.createdAt).toLocaleString()} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="points" className="space-y-4">
					<AdjustPointsForm userId={user.id} />
					<PointsHistoryTable userId={user.id} />
				</TabsContent>

				<TabsContent value="pro" className="space-y-4">
					<ProGrantForm
						userId={user.id}
						isPro={user.isPro}
						proSource={user.proSource ?? null}
						proExpiresAt={user.proExpiresAt ?? null}
					/>
				</TabsContent>
			</Tabs>
		</>
	)
}

const Field = ({
	label,
	value,
}: {
	label: string
	value: string | number | null | undefined
}) => (
	<div className="flex flex-col gap-0.5">
		<span className="text-muted-foreground text-xs">{label}</span>
		<span className="font-medium">
			{value ?? <span className="text-muted-foreground">-</span>}
		</span>
	</div>
)

function AdjustPointsForm({ userId }: { userId: string }) {
	const queryClient = useQueryClient()
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(adminAdjustPointsSchema),
		defaultValues: { delta: 0, reason: "" },
	})

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(api.v3.admin.users({ id: userId }).points.post(values), {
			loading: { title: "Adjusting points..." },
			success: { title: "Points adjusted" },
			error: (err) => ({
				title: "Failed to adjust",
				description: err instanceof Error ? err.message : "Try again",
			}),
		})
		reset({ delta: 0, reason: "" })
		await queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] })
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Adjust points</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={onSubmit}
					className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end"
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="delta">Delta</Label>
						<Input
							id="delta"
							type="number"
							{...register("delta", { valueAsNumber: true })}
							disabled={isSubmitting}
						/>
						{errors.delta ? (
							<span className="text-destructive text-xs">{errors.delta.message}</span>
						) : null}
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="reason">Reason</Label>
						<Input id="reason" {...register("reason")} disabled={isSubmitting} />
						{errors.reason ? (
							<span className="text-destructive text-xs">{errors.reason.message}</span>
						) : null}
					</div>
					<Button type="submit" disabled={isSubmitting}>
						Apply
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}

function PointsHistoryTable({ userId }: { userId: string }) {
	const { data, isLoading } = useAdminUserPointsHistory(userId)
	const items = data?.items ?? []
	return (
		<Card>
			<CardHeader>
				<CardTitle>Points history</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-32 w-full" />
				) : items.length === 0 ? (
					<p className="text-muted-foreground text-sm">No history yet.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>When</TableHead>
								<TableHead>Reason</TableHead>
								<TableHead className="text-right">Delta</TableHead>
								<TableHead>Note</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="whitespace-nowrap text-muted-foreground">
										{new Date(row.createdAt).toLocaleString()}
									</TableCell>
									<TableCell>{row.reason}</TableCell>
									<TableCell
										className={`text-right tabular-nums ${row.delta < 0 ? "text-destructive" : "text-foreground"}`}
									>
										{row.delta > 0 ? "+" : ""}
										{row.delta}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{row.adminNote ?? "-"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}

function ProGrantForm({
	userId,
	isPro,
	proSource,
	proExpiresAt,
}: {
	userId: string
	isPro: boolean
	proSource: string | null
	proExpiresAt: Date | null
}) {
	const queryClient = useQueryClient()
	const [grant, setGrant] = useState(!isPro)
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(adminProGrantSchema),
		defaultValues: { grant: !isPro, expiresAt: null, reason: "" },
	})

	const onSubmit = handleSubmit(async (values) => {
		const { error } = await api.v3.admin.users({ id: userId }).pro.post({
			grant,
			expiresAt: values.expiresAt ?? null,
			reason: values.reason,
		})
		if (error) {
			const message =
				error.value && typeof error.value === "object" && "error" in error.value
					? String((error.value as { error: unknown }).error)
					: "Try again"
			sileo.error({ title: "Failed", description: message })
			return
		}
		sileo.success({ title: grant ? "Pro granted" : "Pro revoked" })
		await queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] })
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pro status</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<Field label="Currently Pro" value={isPro ? "yes" : "no"} />
					<Field label="Source" value={proSource} />
					<Field
						label="Expires"
						value={proExpiresAt ? new Date(proExpiresAt).toLocaleDateString() : null}
					/>
				</div>

				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Switch id="grant" checked={grant} onCheckedChange={setGrant} />
						<Label htmlFor="grant">{grant ? "Grant Pro" : "Revoke Pro"}</Label>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="expiresAt">Expires at (optional, grants only)</Label>
						<Controller
							control={control}
							name="expiresAt"
							render={({ field }) => (
								<Input
									id="expiresAt"
									type="datetime-local"
									disabled={isSubmitting || !grant}
									value={
										field.value ? new Date(field.value).toISOString().slice(0, 16) : ""
									}
									onChange={(e) =>
										field.onChange(
											e.target.value ? new Date(e.target.value).toISOString() : null
										)
									}
								/>
							)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="pro-reason">Reason</Label>
						<Textarea
							id="pro-reason"
							rows={2}
							{...register("reason")}
							disabled={isSubmitting}
						/>
						{errors.reason ? (
							<span className="text-destructive text-xs">{errors.reason.message}</span>
						) : null}
					</div>
					<Button type="submit" disabled={isSubmitting} className="self-end">
						{grant ? "Grant" : "Revoke"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
