import express from 'express'
import countryRouter from './country.router.js';



const router = express.Router();

router.use('/country', countryRouter);


export default router


