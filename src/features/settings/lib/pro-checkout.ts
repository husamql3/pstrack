type CheckoutResult = {
	data?: {
		url?: string
		redirect?: boolean
	} | null
	error?: {
		message?: string
	} | null
}

type ProCheckoutClient = {
	checkout: (data: {
		slug: "pstrack"
		successUrl: "/success?checkout_id={CHECKOUT_ID}"
		returnUrl: "/settings/account"
	}) => Promise<CheckoutResult>
}

const PRO_CHECKOUT_REQUEST = {
	slug: "pstrack",
	successUrl: "/success?checkout_id={CHECKOUT_ID}",
	returnUrl: "/settings/account",
} as const

export const startProCheckout = async (
	client: ProCheckoutClient,
	assignLocation: (url: string) => void = (url) => window.location.assign(url)
) => {
	const { data, error } = await client.checkout(PRO_CHECKOUT_REQUEST)

	if (error) throw new Error(error.message ?? "Could not start Polar checkout")
	if (!data?.url) throw new Error("Polar did not return a checkout URL")

	assignLocation(data.url)
	return data.url
}
