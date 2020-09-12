import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { Post } from "./entities/Post";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post],
  dbName: "lireddit",
  user: "admin",
  password: "password123",
  debug: process.env.NODE_ENV !== "prod",
  type: "postgresql",
} as Parameters<typeof MikroORM.init>[0];
