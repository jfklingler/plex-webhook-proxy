## Plex Webhook Proxy

Plex has implemented their webhooks to send `multipart/form-data` requsts which are incompatible with...most of the known universe.
This is a (very) simple proxy that accepts the `multipart/form-data` requests, extracts the `payload` field, and forwards it with an `application/json` content type.
It's not able to do any kind of transformations on the payload.
If you need anything fancier than just forwarding the JSON part of Plex requests, you probably want something like Tautulli.

This was designed with the assumption that this proxy and the Plex server are on the same, trusted network.
I would encourage you to think long and hard about it if you're considering exposing this for incoming requests from external Plex servers.
It's probably a bad idea.

### What About Tautulli

Tautulli can definintely send appropriately typed webhook requests.
Tautulli is kind of heavy.
This is a ~125MB image and runs in about 20MB of memory with inconsequential CPU usage.
If you're already running Tautulli though, you probably don't need this.

### On Thumbnails
When a request is received from Plex, the `thumb` field is thrown away.
If you actually want the thumbnail, this is not the tool you're looking for.

## Configuration

There really isn't much to it; it's all configured with environment variables.
The `POST_URL` is where the `application/json` requests will be sent after the `payload` is removed from the `multipart/form-data` request.

| Env Variable | Description | Default |
| --- | --- | --- |
| `LISTEN_PORT` | The port to listen on for requests from Plex. | `8080` |
| `LISTEN_PATH` | The path to accept Plex requests at. This path is not included in forwarded requests. | `/` |
| `SELF_TEST_PATH` | The local path to forward requests to when `POST_URL` is not specified. The only reason to change this would be when the default is what want to use for `LISTEN_PATH`. | `/self-test` |
| `HEALTH_PATH` | Path to use for health checks (k8s readiness probes, etc.). Requests to this path always return a `200`.| `/healthz` |
| `LOG_HEALTH_REQUESTS` | Whether or not requests to the `HEALTH_PATH` should be logged. | `false` |
| `POST_URL` | The URL to forward reqests to. You can include query paramters and they will be merged with incoming query parameters. I don't know what happens if you have the same query key in both URLs - don't do that. If not specifed, requests are looped back to the `SELF_TEST_PATH` for debugging. |  |
| `LOG_LEVEL` | Changes the log level. | `info` |

### Examples

I run k8s so that's the easiest example I've got.
There's no reason this won't on a simpler docker-only or swarm setup though.
If you get it working in other environments, feel free to submit examples.

#### Kubernetes

If the yaml below is applied to the `plex-proxy` namespace and Plex is also running in kubernetes, then the Plex webhook would be `http://plex-proxy.plex-proxy.svc.cluster.local/`.
Easy peasy.

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plex-webhook-proxy
  labels:
    app: plex-webhook-proxy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: plex-webhook-proxy
  template:
    metadata:
      labels:
        app: plex-webhook-proxy
    spec:
      containers:
      - name: proxy
        image: ghcr.io/jfklingler/plex-webhook-proxy:0.1.0
        env:
        - name: POST_URL
          value: "http://plex-webhook-eventsource-svc.argo-events.svc.cluster.local:12000/plex-event"
        ports:
        - name: http
          containerPort: 8080
        resources:
          requests:
            cpu: 200m
            memory: 50Mi
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: plex-proxy
spec:
  ports:
    - protocol: TCP
      name: http
      port: 80
      targetPort: 8080
  selector:
    app: plex-webhook-proxy
```
