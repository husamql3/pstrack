// import { Database } from '@/types/supabase'
//
// // Dummy data for the `groups` table
// export const groups: Database['public']['Tables']['groups']['Row'][] = [
//   {
//     id: '1',
//     group_name: 'Group A',
//     group_no: 1,
//   },
// ]
//
// // Dummy data for the `leetcoders` table
// export const leetcoders: Database['public']['Tables']['leetcoders']['Row'][] = [
//   {
//     id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
//     name: 'Hüsam',
//     email: 'john.doe@example.com',
//     username: 'husam',
//     group_no: 1,
//     status: 'approved',
//     gh_username: 'johndoe',
//     lc_username: 'johndoe',
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '2',
//     name: 'Jane Smith',
//     email: 'jane.smith@example.com',
//     username: 'janesmith',
//     group_no: 1,
//     status: 'approved',
//     gh_username: 'janesmith',
//     lc_username: 'janesmith',
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '3',
//     name: 'Alice Johnson',
//     email: 'alice.johnson@example.com',
//     username: 'alicej',
//     group_no: 1,
//     status: 'approved',
//     gh_username: 'alicej',
//     lc_username: 'alicej',
//     created_at: new Date().toISOString(),
//   },
// ]
//
// // Dummy data for the `roadmap` table
// export const roadmap: Database['public']['Tables']['roadmap']['Row'][] = [
//   {
//     id: '1',
//     topic: 'array-hashmap',
//     difficulty: 'Easy',
//     link: 'https://leetcode.com/problems/two-sum',
//     problem_no: 1,
//     problem_order: 1,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '2',
//     topic: 'linked-list',
//     difficulty: 'Medium',
//     link: 'https://leetcode.com/problems/add-two-numbers',
//     problem_no: 2,
//     problem_order: 2,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '3',
//     topic: 'string',
//     difficulty: 'Medium',
//     link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters',
//     problem_no: 3,
//     problem_order: 3,
//     created_at: new Date().toISOString(),
//   },
// ]
//
// // Dummy data for the `group_progres` table
// export const group_progres: Database['public']['Tables']['group_progress']['Row'][] = [
//   {
//     id: '1',
//     group_no: 1,
//     current_problem: 1, // Group is currently working on problem 1
//     created_at: new Date().toISOString(),
//   },
// ]
//
// // Dummy data for the `submission` table
// export const submission: Database['public']['Tables']['submission']['Row'][] = [
//   // John Doe's submissions
//   {
//     id: '1',
//     user_id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9', // John Doe
//     group_id: '1', // Group A
//     problem_id: '1', // Two Sum
//     solved: true,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '2',
//     user_id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9', // John Doe
//     group_id: '1', // Group A
//     problem_id: '2', // Add Two Numbers
//     solved: false,
//     created_at: new Date().toISOString(),
//   },
//   // Jane Smith's submissions
//   {
//     id: '3',
//     user_id: '2', // Jane Smith
//     group_id: '1', // Group A
//     problem_id: '1', // Two Sum
//     solved: true,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '4',
//     user_id: '2', // Jane Smith
//     group_id: '1', // Group A
//     problem_id: '2', // Add Two Numbers
//     solved: true,
//     created_at: new Date().toISOString(),
//   },
//   // Alice Johnson's submissions
//   {
//     id: '5',
//     user_id: '3', // Alice Johnson
//     group_id: '1', // Group A
//     problem_id: '1', // Two Sum
//     solved: false,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: '6',
//     user_id: '3', // Alice Johnson
//     group_id: '1', // Group A
//     problem_id: '3', // Longest Substring Without Repeating Characters
//     solved: true,
//     created_at: new Date().toISOString(),
//   },
// ]
//
// // Export all data as a single object (optional)
// export const dummyData = {
//   groups,
//   leetcoders,
//   roadmap,
//   group_progres,
//   submission,
// }
