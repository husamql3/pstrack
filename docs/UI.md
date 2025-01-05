## UI library

1. https://ui.shadcn.com/
2. https://originui.com/
3. https://ui.aceternity.com/
4. https://magicui.design/

- I stick to ShadCN for almost everything, get all components from the ShadCN library, and customize them, so we do not create anything from scratch reducing time, focusing on the important stuff

## Colors

- https://tailwindcss.com/docs/customizing-colors **ZINC**
- you may choose our main/primary color (blur or sky are preferred)

## Icons

- https://hereact-icons.github.io/react-icons/icons/hi2/
  - Try to get all icons from one lib (like hi2 or fa or whatever but try to get all from one lib)

---

## PAGES:

- Auth
- Track
- Profile
- Admin Dashboard

### Auth

- Signup we can start with smth from [here](https://ui.shadcn.com/blocks/authentication)
  - firstname
  - lastname (optional)
  - username (unique)
  - email
  - password
- Login
  - email
  - password
  - OAuth (github & google)
    - NOTE: if the user has logged in with OAuth, it will be marked as first login and show a modal for completing the sign up process (firstname, lastname, username)
- Forgot Password
- Reset Password
- Change Password

## Track

- Layout: one page have sidebar and table
  - [preview](https://x.com/emirbekinn/status/1871611239933350147) almost the same layout
  - sidebar:
    - logo
    - get started
    - groups (for later)
    - profile (settings)
    - logout
  - table [preview](https://x.com/husamahmud/status/1761153344968782004?s=46) and like [img](assets/img1.jpg)
    - columns:
      - Date
      - Problem number (link)
      - topic (like stack or sliding window or binary search)
      - difficulty (easy, medium, hard)
      - Count (how many users solved this problem)
    - each user can check for today's progress
    - Only if the user submit the today's problem he can share the solution with the community
      - honstly IDK where to put this
      - for previewing user's solution we gonna use [this](https://x.com/pacovitiello/status/1873701588755427522?s=46)
      - for submitting the solution (up to you)
        - I think it will a sumbitino link (from GitHub) OR a text area for the user to share their solution
        - and a button to submit the solution
    - usernames of the users will be like this [hover card](https://ui.shadcn.com/docs/components/hover-card) like @husam

## Profile
