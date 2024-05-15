import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.js';
import router from './routes/index.js';

dotenv.config();

const app = express();

db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsConfig = {
    origin: true,
    credentials: true,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use('/v1', router);
app.use((req, res, next) => {
    console.log('info', `${req.method} ${req.url}`);
    next();
});

app.listen(process.env.PORT, () => console.log('Server running on port 5000'));