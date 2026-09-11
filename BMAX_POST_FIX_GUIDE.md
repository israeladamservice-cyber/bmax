# BMAX “Failed to create post” Fix Guide (Supabase + ImageKit)

## 1) Fix Vercel build error: “Can’t resolve 'imagekit'”
Your Vercel build log shows:

`Module not found: Can't resolve 'imagekit'`

That means your repo is missing the server SDK dependency.

### Add this to `package.json` -> dependencies:
Ensure you have BOTH:

- `imagekit`
- `@imagekit/next`

Example:

```json
"dependencies": {
  "@imagekit/next": "^2.1.0",
  "imagekit": "^6.0.0"
}
