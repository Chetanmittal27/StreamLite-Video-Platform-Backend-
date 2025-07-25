import mongoose from 'mongoose'
import { db_name } from '../constants.js'

const connectDB = async () => {

    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`);
        console.log(`MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`)
    }

    catch(error){
        console.log("ERROR" , error);
        process.exit(1);
    }
}

export default connectDB;


