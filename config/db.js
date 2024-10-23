import mongoose from "mongoose";


const db = async () => {
    try {
        mongoose.set('strictQuery', true)
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
}


export default db