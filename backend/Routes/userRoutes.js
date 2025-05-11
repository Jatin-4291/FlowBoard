import express from "express";
import { getRoom } from "../Controllers/userControllers.js";

const Router = express.Router();
Router.get("/get-room", getRoom);

export default Router;
