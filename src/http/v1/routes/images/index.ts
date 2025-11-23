import Elysia from "elysia";
import { effectsRoutes } from "./effects";

export const imagesRoutes = new Elysia({ prefix: "/images" }).use(effectsRoutes);
