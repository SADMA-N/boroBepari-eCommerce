# Seller Portal Security Notes

- Client-side sanitization is applied for rich text inputs to reduce XSS risk.
- File uploads validate type and size on the client.
- Server-side validation should enforce size/type, antivirus scanning, and strict MIME checks.
- CSRF and rate-limiting should be enforced at the API gateway or server middleware.
