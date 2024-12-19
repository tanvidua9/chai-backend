//require(`dotenv`).config({path: `.env`})
import mongoose from "mongoose";
 import {DB_NAME} from "./constants.js"
  import dotenv from "dotenv";
//  import connectDB from "./db/index.js";
 
  dotenv.config({
    path:'./env'
  });  
 
//  connectDB();
 



//first approach to connect DB
import express from "express"
const app= express()

;(async ()=> {
    try{
        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERRR: ",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.error("ERROR: ",error)
        throw err
    }
})()

