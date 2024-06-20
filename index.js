import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.js';
import router from './routes/index.js';
import client from 'prom-client';


dotenv.config();

const app = express();
const register = new client.Registry();

const corsConfig = {
    origin: true,
    credentials: true,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

db();
const metric_label_enum = {
    PATH: "path",
    METHOD: "method",
    STATUS_CODE: "status_code",
};
class MetricLabelClass {
    constructor(method, pathname, statusCode) {
        this.method = method;
        this.path = pathname;
        this.status_code = statusCode;
    }
}
register.setDefaultLabels({
    app: 'redis-backend-app'
})
const http_request_total = new client.Counter({
    name: "node_http_request_total",
    help: "The total number of HTTP requests received",
    labelNames: [
        metric_label_enum.PATH,
        metric_label_enum.METHOD,
        metric_label_enum.STATUS_CODE,
    ],
});
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['route'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
});
app.use((req, res, next) => {
    const responseTimeInMs = Date.now() - res.locals.startEpoch

    httpRequestDurationMicroseconds
        .labels(req.method, req.route.path, res.statusCode)
        .observe(responseTimeInMs)

    next()
})
client.collectDefaultMetrics({ register })
register.registerMetric(http_request_total);

app.use((req, res, next) => {

    const req_url = new URL(req.url, `http://${req.headers.host}`);

    const original_res_send_function = res.send;

    const res_send_interceptor = function (body) {
        http_request_total.inc(
            new MetricLabelClass(req.method, req_url.pathname, res.statusCode)
        );
        original_res_send_function.call(this, body);
    };

    res.send = res_send_interceptor;
    next();
});



app.get("/metrics", async (req, res, next) => {
    res.setHeader("Content-type", register.contentType);
    res.send(await register.metrics());
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', router);
app.use((req, res, next) => {
    console.log('info', `${req.method} ${req.url}`);
    next();
});

app.listen(process.env.PORT, () => console.log('Server running on port 5500'));
