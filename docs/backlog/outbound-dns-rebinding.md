# DNS rebinding in the guarded fetch

## Now
- `guardedFetch` in `platform/outbound-http` resolves the host of a custom LLM endpoint with `dns.lookup`, refuses the call when any address is private or reserved, and then hands the URL to `fetch`, which resolves the host again on its own (D239, D273).
- Between the two lookups a hostile DNS server can answer differently: a public address for the check, a private one for the connection. The check passes and the request reaches an internal address. This is a time-of-check to time-of-use gap.
- `NodeOutboundHttpGateway` does not have the gap: it checks the addresses inside the `lookup` option of `http.request`, so the socket connects to the address that was checked. Only the AI SDK path for custom endpoints, which needs a `fetch`, has it.

The risk is accepted while custom endpoints are new: a workspace must first save a key for the endpoint, the call carries only the prompt and the workspace's own key, and the reply is parsed as a model answer, not shown raw.

## Fix
1. `guardedFetch` passes an undici `Agent` as the `dispatcher` of each request, built with `connect: { lookup }`, where `lookup` resolves the host, refuses private and reserved addresses with `OutboundAddressBlockedError` and returns the checked address to the connector.
2. The separate pre-check in `guardedFetch` goes, so every connection is checked by the address it connects to; the URL check (`parseOutboundUrl`) stays.
3. `undici` becomes a direct dependency of the backend, pinned to the major that Node ships.
4. A test serves a name that resolves to a public address first and to `127.0.0.1` next, and checks that the request is refused.

## Depends on
- Nothing.
