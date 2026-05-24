export type Step = 0 | 1 | 2
export type FieldStatus = "idle" | "checking" | "valid" | "invalid"

export interface ProfileState {
	username: string
	usernameStatus: FieldStatus
	usernameError: string
	leetcodeHandle: string
	leetcodeStatus: FieldStatus
	codeforcesHandle: string
	codeforcesStatus: FieldStatus
}
