# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to [your-email@example.com] or open a private security advisory on GitHub.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and provide regular updates.

## Known Issues

None currently. All dependencies are up to date with no known vulnerabilities.

## Security Best Practices

When deploying this application:

1. Always use production builds (`npm run build`)
2. Serve static files through a proper web server (nginx, Apache, etc.)
3. Enable HTTPS for public deployments
4. Keep dependencies up to date
5. Review settings before allowing user configuration in multi-tenant scenarios
