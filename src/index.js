// require('dotenv').config({path : './env'});

import dotenv from 'dotenv'
import  app  from './app.js';
import connectDB from './db/index.js';

// Load Environmental Variables
dotenv.config({
    path: './.env'
})


// Method-2
connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000 , () => {
        console.log(`Application running on the PORT ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection error " , err);
})










// Method 1 to connect with database using IFFEs
/*
import express from 'express'

const app = express()

(async () => {
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
       app.on("error" , () => {
        console.log("ERROR" , error);
        throw error;
       })

       app.listen(process.env.PORT , () => {
        console.log(`App is listening on port ${process.env.PORT}`);
       })
    }
    catch(error){
        console.error("Error : " , error);
        throw error;
    }
})()

*/