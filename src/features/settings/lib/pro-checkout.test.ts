import { describe, expect, it, vi } from "vitest"

import { startProCheckout } from "./pro-checkout"

describe("startProCheckout", () => {
	it("creates a Polar checkout with the Pro slug and redirects the browser to the returned URL", async () => {
		const checkout = vi.fn().mockResolvedValue({
			data: { url: "https://sandbox.polar.sh/checkout/abc", redirect: true },
			error: null,
		})
		const assignLocation = vi.fn()

		await expect(startProCheckout({ checkout }, assignLocation)).resolves.toBe(
			"https://sandbox.polar.sh/checkout/abc"
		)

		expect(checkout).toHaveBeenCalledWith({
			slug: "pstrack",
			successUrl: "/success?checkout_id={CHECKOUT_ID}",
			returnUrl: "/settings/account",
		})
		expect(assignLocation).toHaveBeenCalledWith("https://sandbox.polar.sh/checkout/abc")
	})

	it("throws the checkout error instead of leaving the loading toast pending", async () => {
		const checkout = vi.fn().mockResolvedValue({
			data: null,
			error: { message: "Checkout creation failed" },
		})

		await expect(startProCheckout({ checkout }, vi.fn())).rejects.toThrow(
			"Checkout creation failed"
		)
	})

	it("throws when Polar does not return a checkout URL", async () => {
		const checkout = vi.fn().mockResolvedValue({ data: { redirect: true }, error: null })

		await expect(startProCheckout({ checkout }, vi.fn())).rejects.toThrow(
			"Polar did not return a checkout URL"
		)
	})
})
