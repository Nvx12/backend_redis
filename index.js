import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.js';
import router from './routes/index.js';
import client from 'prom-client';
import axios from 'axios';


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
};

register.setDefaultLabels({
    app: 'redis-backend-app'
});

const http_request_total = new client.Counter({
    name: "node_http_request_total",
    help: "The total number of HTTP requests received",
    labelNames: [
        metric_label_enum.PATH,
        metric_label_enum.METHOD,
        metric_label_enum.STATUS_CODE,
    ],
});

const http_response_rate_histogram = new client.Histogram({
    name: "node_http_duration",
    labelNames: [
        metric_label_enum.PATH,
        metric_label_enum.METHOD,
        metric_label_enum.STATUS_CODE,
    ],
    help: "The duration of HTTP requests in seconds",
    buckets: [1, 2, 3, 4, 5, 10, 25, 50, 100, 250, 500, 1000],
});

client.collectDefaultMetrics({ register });
register.registerMetric(http_request_total);
register.registerMetric(http_response_rate_histogram);

app.use((req, res, next) => {

    const req_url = new URL(req.url, `http://${req.headers.host}`);
    const endTimer = http_response_rate_histogram.startTimer();
    const original_res_send = res.send.bind(res);

    res.send = function (body) {
        endTimer(new MetricLabelClass(req.method, req_url.pathname, res.statusCode));
        http_request_total.inc(new MetricLabelClass(req.method, req_url.pathname, res.statusCode));
        console.log(`HTTP request to ${req.method} ${req_url.pathname} responded with status ${res.statusCode}`);
        return original_res_send(body);
    };
    next();
});

app.get("/metrics", async (req, res, next) => {
    res.setHeader("Content-type", register.contentType);
    res.send(await register.metrics());
    next();
});

app.get('/queries', async (req, res) => {
    try {
        const response = await axios.get('http://prometheus:9090/api/v1/query', {
            params: {
                query: 'up'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', router);
app.use((req, res, next) => {
    console.log('info', `${req.method} ${req.url}`);
    next();
});

app.listen(process.env.PORT, () => console.log(`Server running on ${process.env.PORT}`));
