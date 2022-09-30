## Plex Webhook Proxy

Plex has implemented their webhooks to send `multipart/form-data` requsts which are incompatible with...most of the known universe.
This is a (very) simple proxy that accepts the `multipart/form-data` requests, extracts the `payload` field, and forwards it with an `application/json` content type.

#### On Thumbnails
When a request is received from Plex, the `thumb` field is thrown away.
If you actuall want the `thumb` field, this is not the tool you're looking for.

| Env Variable | Description | Default |
| --- | --- | --- |
| `LISTEN_PORT` | The port to listen on for requests from Plex. | `8080` |
| `LISTEN_PATH` | The path to accept Plex requests at. This path is not included in forwarded requests. | `/` |
| `SELF_TEST_PATH` | The local path to forward requests to when `POST_URL` is not specified. The only reason to change this would be when the default is what want to use for `LISTEN_PATH`. | `/self-test` |
| `HEALTH_PATH` | Path to use for health checks (k8s readiness probes, etc.). Requests to this path always return a `200`.| `/healthz` |
| `LOG_HEALTH_REQUESTS` | Whether or not requests to the `HEALTH_PATH` should be logged. | `false` |
| `POST_URL` | The URL to forward reqests to. You can include query paramters and they will be merged with incoming query parameters. I don't know what happens if you have the same query key in both URLs - don't do that. If not specifed, requests are looped back to the `SELF_TEST_PATH` for debugging. |  |
| `LOG_LEVEL` | Changes the log level. | `info` |
