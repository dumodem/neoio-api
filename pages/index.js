import dynamic from "next/dynamic";
import { useQuery, useLazyQuery, gql } from "@apollo/client";
import { useState } from "react";
import _ from "lodash";

const articleQuery = gql`
{
  articles(options:{
    limit:10
  })
  {
    authors{
      name
      __typename
    }
    title
    article_id
    article_link
    sentences{
      id
      text
      __typename
      entities{
        name
        type
        __typename
      }
    }
  }
}
`;

const NoSSRForceGraph = dynamic(() => import("../lib/NoSSRForceGraph"), {
  ssr: false,
});

const formatData = (data) => {
  const nodes = [];
  const links = [];

  if (!data.articles) {
    return { nodes, links };
  }

  data.articles.forEach((a) => {
    nodes.push({
      id: a.article_id,
      url: a.article_link,
      __typename: a.__typename,
      title: a.title,
    });

    nodes.push({
      id: a.authors.name,
      __typename: a.authors.__typename,
    });

    links.push({
      source: a.authors.name,
      target: a.article_id,
    });

    a.sentences.forEach((s) => {
      nodes.push({
        id: s.id,
        __typename: s.__typename,
      });

      links.push({
        source: a.article_id,
        target: s.id,
      });
      s.entities.forEach((e) => {
        nodes.push({
          id: e.name,
          __typename: e.__typename,
        });
        links.push({
          source: s.id,
          target: e.name
        })
      })
    });
    
  });

  return {
    nodes: _.uniqBy(nodes, "id"),
    links,
  };
};

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const { data } = useQuery(articleQuery, {
    onCompleted: (data) => setGraphData(formatData(data)),
  });

  return (
    <NoSSRForceGraph
      graphData={graphData}
      nodeLabel={(node) => {
        return node.id;
      }}
      nodeAutoColorBy={'__typename'}
      nodeRelSize={8}
      onNodeClick={(node, event) => {
        console.log('You clicked me!');
        console.log(node);

        if (node.__typename == 'Article') {
          window.open(node.url, '_blank');
        }
      }}
    />
  );
}