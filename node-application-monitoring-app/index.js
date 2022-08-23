const client = require('prom-client');
const express = require('express');

const app = express();
const PORT = 8000;

const httpRequestTimer = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code', 'message'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
});

// Create a registry and pull default metrics
const register = new client.Registry();
register.registerMetric(httpRequestTimer);
client.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
    const end = httpRequestTimer.startTimer();
    const route = req.route.path;

    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());

    // End timer and add labels
    end({ route, code: res.statusCode, method: req.method, message: "Metrics!!" });
});

app.get("/api", (req, res) => {
    res.status(200).send("Api Works!");
});
app.get("/api/fast/", (req, res) => {
    const end = httpRequestTimer.startTimer();
    const route = req.route.path;
    res.status(200).send({ route, code: res.statusCode, method: req.method, message: "Fast API!" });
    end({ route, code: res.statusCode, method: req.method, message: "Metrics!!" });

});
app.get("/api/slow", (req, res) => {
    const end = httpRequestTimer.startTimer();
    const route = req.route.path;
    setTimeout(() => {
        res.status(200).send({ route, code: res.statusCode, method: req.method, message: "Slow API!" });
        end({ route, code: res.statusCode, method: req.method, message: "Metrics!!" });
    }, 2000);
});

app.get("/api/error", (req, res, next) => {
    try {
        throw new Error("Something broke...");
    } catch (error) {
        res.status(500).send({ route, code: res.statusCode, method: req.method, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`API is listening on port ${PORT}`);
});