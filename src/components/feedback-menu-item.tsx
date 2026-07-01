import { zodResolver } from "@hookform/resolvers/zod"
import { IconMessage } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useSubmitGeneralFeedback } from "@/hooks/use-submit-general-feedback"
import {
	type GeneralFeedbackFormInput,
	generalFeedbackFormSchema,
} from "@/server/feedback/feedback.type"

export const FeedbackMenuItem = () => {
	const [submitted, setSubmitted] = useState(false)
	const submitFeedback = useSubmitGeneralFeedback()

	const { register, handleSubmit } = useForm<GeneralFeedbackFormInput>({
		resolver: zodResolver(generalFeedbackFormSchema),
		defaultValues: { description: "" },
	})

	const isPending = submitFeedback.isPending

	const onSubmit = handleSubmit(async (values) => {
		await submitFeedback.mutateAsync(values.description)
		setSubmitted(true)
	})

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<IconMessage aria-hidden="true" />
				Feedback
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent className="w-96 p-3" sideOffset={4}>
					<form onSubmit={onSubmit} className="flex flex-col gap-2.5">
						<Textarea
							{...register("description")}
							placeholder="Share your thoughts..."
							rows={4}
							disabled={isPending || submitted}
							onKeyDown={(e) => e.stopPropagation()}
							className="min-h-44 resize-none text-sm"
						/>
						<div className="flex items-center justify-between gap-2">
							{submitted ? (
								<p className="text-primary text-xs">Thanks, feedback sent!</p>
							) : (
								<p className="text-muted-foreground text-xs">
									Need help?{" "}
									<a
										href="mailto:h@ql3.dev"
										className="underline underline-offset-2 hover:text-foreground"
									>
										Contact us
									</a>{" "}
									or{" "}
									<Link
										to="/how-it-works"
										className="underline underline-offset-2 hover:text-foreground"
									>
										see how it works
									</Link>
								</p>
							)}
							{!submitted && (
								<Button type="submit" size="sm" disabled={isPending} className="shrink-0">
									{isPending ? "Sending..." : "Submit"}
								</Button>
							)}
						</div>
					</form>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	)
}
