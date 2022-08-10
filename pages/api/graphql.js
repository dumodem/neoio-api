import { gql, ApolloServer } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
//import "ts-tiny-invariant"

const typeDefs = gql`
  type Article @exclude(operations: [CREATE, UPDATE, DELETE]) {
    article_id: String
    article_link: String
    title: String
    summary: String
    authors: [Author!]!@relationship(type: "WROTE", direction: IN)
    sentences: [Sentence!]! @relationship(type: "HAS_SENTENCE", direction: OUT)
  }
  type Author @exclude(operations: [CREATE, UPDATE, DELETE]) {
    name: String
    articles: [Article!]! @relationship(type: "WROTE", direction: OUT)
  }
  type Sentence @exclude(operations: [CREATE, UPDATE, DELETE]) {
    id:String
    text: String
    entities: [Entity!]! @relationship(type:"MENTIONS", direction: OUT)
  }
  type Entity @exclude(operations: [CREATE, UPDATE, DELETE]) {
    id:String
    name: String
    type:String
    sentences: [Sentence!]! @relationship(type:"MENTIONS", direction: IN)
  }

`;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({typeDefs, driver})

export default async function handler(req, res) {
  const schema = await neoSchema.getSchema();
  const apolloServer = new ApolloServer({
    schema: schema,
    playground: true,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
    csrfPrevention: true,  
    cache: "bounded",
    cors: {
    origin: ["https://neoio-api.vercel.app", "https://studio.apollographql.com"]
  },
  });

  const startServer = apolloServer.start();
  await startServer;

  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};