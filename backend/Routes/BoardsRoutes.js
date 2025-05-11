import express from "express";
import { getMessages, sendMessage } from "../Controllers/boardControlllers.js";
const Router = express.Router();
Router.get("/get-messages", getMessages);
Router.post("/send-message", sendMessage);

export default Router;
