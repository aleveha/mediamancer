import Elysia from "elysia";
import { imagesRoutes } from "./images";

export const v1Routes = new Elysia({ prefix: "/v1" }).use(imagesRoutes);
