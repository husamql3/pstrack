# AMD64 production container target

The Coolify VPS runs Ubuntu 24.04 LTS on `x86_64`, so PStrack production Docker images target `linux/amd64`.

ADR 0001 assumed an ARM64 Hetzner CAX server, but the actual production server architecture is AMD64. GitHub Actions should keep building the production image for `linux/amd64` unless the production VPS is replaced with a different architecture.
