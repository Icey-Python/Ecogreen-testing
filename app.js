import 'dotenv/config'
import express from "express";
import { Borgen, Logger } from "borgen";
import { StatusCodes } from "http-status-codes";
import { Config } from './lib/config.js';
import compression from 'compression';
import connectDB from './database/connect.js';
import router from './router/router.js';

const app = express();

// Middlewares
app.use(Borgen({}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended:true}))

// Routes
app.use(router)

// Server status
app.get("/ping", (req, res) => {
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Server is running..",
    data: null,
  });
});

const startServer = async () => {
    app.listen(Config.PORT,()=>{
        Logger.info({message:`Server is listening on port ${Config.PORT}`})
    })
}

connectDB(startServer);