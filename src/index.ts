import { envs } from "~/config/envs";
import { app } from "~/http/app";

app.listen(envs.PORT);
