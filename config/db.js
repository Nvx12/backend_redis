import mongoose from "mongoose";


const db = async () => {
    try {
        mongoose.set('strictQuery', true)
        await mongoose.connect('mongodb://mongodb:27017/test');
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
}


export default db