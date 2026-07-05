// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"

import { GroupProblemsCell } from "./group-problems-cell"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const renderCell = (props: Partial<Parameters<typeof GroupProblemsCell>[0]> = {}) => {
	const container = document.createElement("div")
	document.body.append(container)
	const root = createRoot(container)

	act(() => {
		root.render(
			<GroupProblemsCell
				solve={null}
				isTodayRow={true}
				isOwnColumn={false}
				isPreJoin={false}
				isCurrentUser={false}
				onSolve={vi.fn()}
				isSolvePending={false}
				{...props}
			/>
		)
	})

	return { container, root }
}

describe("GroupProblemsCell", () => {
	it("renders an empty checkbox for unsolved today cells even when they are not interactive", () => {
		const { container, root } = renderCell()

		const checkbox = container.querySelector("[role='checkbox']")
		expect(checkbox).not.toBeNull()
		expect(checkbox?.getAttribute("aria-label")).toBe("Not solved today")
		expect(checkbox?.hasAttribute("disabled")).toBe(true)

		act(() => root.unmount())
	})

	it("renders a placeholder for historical cells without a solve row", () => {
		const { container, root } = renderCell({ isTodayRow: false })

		expect(container.textContent).toContain("-")
		expect(container.querySelector("[role='checkbox']")).toBeNull()

		act(() => root.unmount())
	})
})
