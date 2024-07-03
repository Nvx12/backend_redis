import mongoose from "mongoose"
import { CountrySchema } from "../models/countryModel.js";
import { RedisConnection } from "../config/redis.config.js";



const Country = mongoose.model('Country', CountrySchema);

export const createCountry = async (req, res) => {
    try {
        const countryName = req.body.name;
        const cacheKey = "countries" + countryName;

        const cacheCountry = await RedisConnection.redis.get(cacheKey);

        if (cacheCountry) {
            return res.status(400).send("Country already exists (cached)");
        } else {
            const foundCountry = await Country.findOne({ name: countryName });
            if (foundCountry) {
                await RedisConnection.redis.set(cacheKey, JSON.stringify(foundCountry));
                return res.status(400).send("Country already exists");
            }
            const country = new Country(req.body);
            await country.save();

            await RedisConnection.redis.set(cacheKey, JSON.stringify(country));

            const countries = await Country.find();
            await RedisConnection.redis.set("countries", JSON.stringify(countries));

            res.status(200).send('Country created');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Country not added due to an error" });
    }
}

export const getCountries = async (req, res) => {
    try {
        const cachedCountries = await RedisConnection.redis.get("countries");
        if (cachedCountries && JSON.parse(cachedCountries).length > 0) {
            const countries = JSON.parse(cachedCountries);
            return res.status(200).send({ msg: "list of countries (cached)", countries });
        } else {
            const countries = await Country.find();
            await RedisConnection.redis.set("countries", JSON.stringify(countries));
            res.status(200).send({ msg: "list of countries", countries });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "countries not found" });
    }
}

export const getCountryById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = "countries" + id;

        const cachedCountry = await RedisConnection.redis.get(cacheKey);

        if (cachedCountry !== null) {
            const country = JSON.parse(cachedCountry);

            return res.status(200).send({ msg: "country found (cached)", country });
        }

        const country = await Country.findById(id);
        if (!country) {
            return res.status(404).send({ msg: "country not found" });
        }

        await RedisConnection.redis.set(cacheKey, JSON.stringify(country));
        res.status(200).send({ msg: "country found", country });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "country not found" });
    }
}


export const deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = "countries" + id;

        const country = await Country.findByIdAndDelete(id);
        if (country) {
            await RedisConnection.redis.del(cacheKey);
            await RedisConnection.redis.del("countries");
            res.status(200).send({ msg: "country deleted", country });
        } else {
            res.status(404).send({ msg: "country not found" });
        }
    } catch (error) {
        res.status(500).send({ msg: "country not deleted" });
    }
}

export const updateCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = "countries" + id;

        const updatedCountry = await Country.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (updatedCountry) {
            await RedisConnection.redis.set(cacheKey, JSON.stringify(updatedCountry));
            await RedisConnection.redis.del("countries");
            res.status(200).send({ msg: "country updated", country: updatedCountry });
        } else {
            res.status(404).send({ msg: "country not found" });
        }
    } catch (error) {
        res.status(500).send({ msg: "country not updated" });
    }
}