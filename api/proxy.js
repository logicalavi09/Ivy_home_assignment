const UPSTREAM_BASE = "https://solve.ivy.homes"
const API_KEY = process.env.IVY_API_KEY || ""
const REQUEST_TIMEOUT_MS = 30000

function buildUpstreamUrl(targetPath, query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (key === "path") continue
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    } else {
      params.append(key, value)
    }
  }
  const search = params.toString()
  return UPSTREAM_BASE + targetPath + (search ? `?${search}` : "")
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*"
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader("Access-Control-Max-Age", "86400")
  res.setHeader("Vary", "Origin")
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  if (!API_KEY) {
    res.status(500).json({
      error: "Server misconfiguration: IVY_API_KEY is not set. Configure it in the environment.",
    })
    return
  }

  const targetPath = req.query.path
  if (!targetPath || !targetPath.startsWith("/")) {
    res.status(400).json({
      error: "Missing or invalid 'path' query parameter. Use /api/<upstream-path> (e.g. /api/v1/listings).",
    })
    return
  }

  const url = buildUpstreamUrl(targetPath, req.query)

  const headers = {
    "X-API-Key": API_KEY,
    Accept: "application/json",
  }
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization
  }
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"]
  }

  const requestInit = {
    method: req.method,
    headers,
    redirect: "follow",
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD"
  if (hasBody && req.body != null) {
    requestInit.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
  }

  let upstream
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    upstream = await fetch(url, { ...requestInit, signal: controller.signal })
    clearTimeout(timer)
  } catch (error) {
    res.status(502).json({
      error: "The service could not be reached. Please try again.",
    })
    return
  }

  const raw = await upstream.text()
  const contentType = upstream.headers.get("content-type") || "application/json"

  if (!upstream.ok) {
    let message
    try {
      const body = JSON.parse(raw)
      message = typeof body?.error === "string" ? body.error
        : typeof body?.detail === "string" ? body.detail
        : typeof body?.message === "string" ? body.message
        : null
    } catch {
      message = null
    }
    if (!message || message.length > 200) {
      message = "The service returned an unexpected response. Please try again."
    }
    res.status(upstream.status <= 599 ? upstream.status : 502).json({ error: message })
    return
  }

  for (const rateHeader of ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]) {
    const value = upstream.headers.get(rateHeader)
    if (value) res.setHeader(rateHeader, value)
  }

  res.setHeader("Content-Type", contentType)
  res.status(upstream.status).send(raw)
}