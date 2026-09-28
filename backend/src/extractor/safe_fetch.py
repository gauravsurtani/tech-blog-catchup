"""Pinned-address HTTP fetch prevents redirect and DNS-rebinding SSRF."""

import asyncio
import http.client
import ipaddress
import socket
import ssl
from urllib.parse import urlsplit, urljoin


def _fetch(url, timeout):
    for _ in range(6):
        parsed = urlsplit(url)
        if (
            parsed.scheme not in ("https", "http")
            or parsed.username
            or parsed.password
            or not parsed.hostname
            or parsed.port not in (None, 80, 443)
        ):
            raise ValueError("Unsupported source URL")
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addresses = socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM)
        if not addresses or any(
            not ipaddress.ip_address(a[4][0]).is_global for a in addresses
        ):
            raise ValueError("Source must use a public address")
        sock = socket.create_connection((addresses[0][4][0], port), timeout)
        try:
            if parsed.scheme == "https":
                sock = ssl.create_default_context().wrap_socket(
                    sock, server_hostname=parsed.hostname
                )
            conn = http.client.HTTPConnection(parsed.hostname, port, timeout=timeout)
            conn.sock = sock
            path = parsed.path or "/"
            if parsed.query:
                path += "?" + parsed.query
            conn.request(
                "GET",
                path,
                headers={
                    "Host": parsed.netloc,
                    "User-Agent": "Blog2Podcast/1.0",
                    "Accept": "text/html",
                    "Accept-Encoding": "identity",
                },
            )
            response = conn.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                url = urljoin(url, response.getheader("Location", ""))
                continue
            if response.status != 200:
                raise ValueError("Source fetch failed")
            if "text/html" not in response.getheader("Content-Type", ""):
                raise ValueError("Source must be HTML")
            body = response.read(2_000_001)
            if len(body) > 2_000_000:
                raise ValueError("Source is too large")
            return body.decode("utf-8", errors="replace")
        finally:
            sock.close()
    raise ValueError("Too many source redirects")


async def fetch_article(url, timeout=30):
    return await asyncio.to_thread(_fetch, url, timeout)
