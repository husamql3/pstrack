import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
	type FeedbackFormInput,
	feedbackFormSchema,
} from "@/server/feedback/feedback.type"
import { useFeedbackPrompt } from "../hooks/use-feedback-prompt"
import { useSubmitFeedback } from "../hooks/use-submit-feedback"

const CATEGORY_LABELS: Record<string, string> = {
	BUG: "Bug report",
	SUGGESTION: "Suggestion",
	GENERAL: "General",
}

export const FeedbackDialog = ({ groupId }: { groupId: string }) => {
	const { data } = useFeedbackPrompt(groupId)
	const submitFeedback = useSubmitFeedback()

	const form = useForm<FeedbackFormInput>({
		resolver: zodResolver(feedbackFormSchema),
		defaultValues: { groupId, category: undefined, description: "" },
	})
	const { register, handleSubmit, control, formState, reset } = form
	const isPending = submitFeedback.isPending

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(submitFeedback.mutateAsync(values), {
			loading: { title: "Sending feedback..." },
			success: {
				title: "Feedback sent!",
				description: "Thank you for helping improve the group.",
			},
			error: () => ({
				title: "Couldn't send feedback",
				description: "Please try again.",
			}),
		})
		reset()
	})

	return (
		<Dialog open={!!data?.shouldShow}>
			<DialogContent
				className="sm:max-w-md"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>How's this group going?</DialogTitle>
					<DialogDescription>
						Quick feedback helps us improve the experience for everyone.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="flex flex-col gap-4 pt-1">
					<div className="grid gap-1.5">
						<Label htmlFor="category">Category</Label>
						<Controller
							control={control}
							name="category"
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isPending}
								>
									<SelectTrigger id="category" className="w-full">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(CATEGORY_LABELS).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						{formState.errors.category && (
							<p className="text-destructive text-xs">
								{formState.errors.category.message}
							</p>
						)}
					</div>

					<div className="grid gap-1.5">
						<Label htmlFor="description">
							Description{" "}
							<span className="text-muted-foreground text-xs">(optional)</span>
						</Label>
						<Textarea
							id="description"
							{...register("description")}
							disabled={isPending}
							placeholder="Tell us more..."
							rows={3}
							maxLength={1000}
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button type="submit" size="sm" disabled={isPending}>
							Send feedback
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
