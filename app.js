import 'dotenv/config'
import express from "express";
import { Borgen, Logger } from "borgen";
import { StatusCodes } from "http-status-codes";
import { Config } from './lib/config.js';
import compression from 'compression';
import connectDB from './database/connect.js';
import router from './router/router.js';
import http from 'http';
import { ExpressPeerServer } from "peer";
import cron from './lib/cronjob.js';
import {Paystack} from 'paystack-sdk'

const app = express();
const server = http.createServer(app);
export const PaystackClient = new Paystack(process.env.PAYSTACK_SECRET_KEY)
const peerServer = ExpressPeerServer(server, {
  proxied: true,
  debug: true,
  path: "/myapp",
  ssl: {},
});

app.use(peerServer);
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
    server.listen(Config.PORT,()=>{
        Logger.info({message:`Server is listening on port ${Config.PORT}`})
    })
}

connectDB(startServer);
