import "reflect-metadata";
import { PostResolver } from "./resolvers/post";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { HelloResolver } from "./resolvers/hello";
import mikroConfig from "./mikro-orm.config";

const PORT = process.env.EXPRESS_PORT;

const main = async () => {
  // setup connection
  const orm = await MikroORM.init(mikroConfig);

  // run migrations
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
};

main().catch((e) => {
  console.error("Error in main(): ", e);
});
