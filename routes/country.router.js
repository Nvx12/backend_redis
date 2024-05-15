import express from 'express';
import { createCountry, deleteCountry, getCountries, getCountryById, updateCountry } from '../controllers/countryController.js';


const countryRouter = express.Router();

countryRouter.get('/', getCountries);
countryRouter.post('/create', createCountry);
countryRouter.get('/:id', getCountryById);
countryRouter.put('/:id', updateCountry);
countryRouter.delete('/:id', deleteCountry);

export default countryRouter;