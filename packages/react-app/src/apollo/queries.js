import { gql } from "apollo-boost";

export const ARTISTS_QUERY = gql`
  query artists($address: Bytes!) {
    artists(where: { address: $address }) {
      id
      inkCount
      address
      inks(orderBy: createdAt, orderDirection: desc) {
        id
        jsonUrl
        limit
        count
        mintPrice
        createdAt
        sales {
          id
          price
        }
      }
    }
  }
`;

export const INKS_QUERY = gql`
  query inks($first: Int, $skip: Int) {
    inks: files(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      inkNumber
      createdAt
      jsonUrl
      artist {
        id
        address
      }
    }
  }
`;

export const EXPLORE_QUERY = gql`
  query inks($first: Int, $skip: Int, $orderBy: String, $orderDirection: String, $filters: Ink_filter, $liker: String) {
    inks(first: $first, skip: $skip where: $filters, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      inkNumber
      createdAt
      jsonUrl
      bestPrice
      bestPriceSource
      bestPriceSetAt
      count
      limit
      likeCount
      likes(where: {liker: $liker}) {
        id
      }
      artist {
        id
        address
      }
    }
  }
`;

export const INK_LIKES_QUERY = gql`
query likes($inks: [BigInt], $liker: String) {
  inks(first: 1000, where: {inkNumber_in: $inks}) {
    id
    inkNumber
    likeCount
    likes(where: {liker: $liker}) {
      id
    }
  }
}`


export const ADMIN_INKS_QUERY = gql`
    query inks($first: Int, $skip: Int, $admins: [String!]) {
        inks: files(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc, where: { likers_contains: $admins }) {
            id
            inkNumber
            createdAt
            jsonUrl
            artist {
                id
                address
            }
        }
    }
`;

export const HOLDINGS_QUERY = gql`
  query tokens($owner: Bytes!) {
    metaData(id: "blockNumber") {
      id
      value
    }
    tokens(where: { owner: $owner }) {
      owner
      id
      ink {
        id
        jsonUrl
        limit
        count
        artist {
          id
          address
        }
      }
    }
  }
`;

export const INK_QUERY = gql`
  query ink($inkUrl: String!) {
    metaData(id: "blockNumber") {
      id
      value
    }
    ink: file(id: $inkUrl) {
      id
      inkNumber
      jsonUrl
      artist {
        id
      }
      limit
      count
      mintPrice
      mintPriceNonce
      tokens {
        id
        owner
        network
        price
      }
    }
  }
`;

export const INK_MAIN_QUERY = gql`
  query token($inkUrl: String!) {
    tokens(where: { ink: $inkUrl }) {
      id
      owner
      ink
    }
  }
`;

export const HOLDINGS_MAIN_QUERY = gql`
  query tokens($owner: Bytes!) {
    tokens(where: { owner: $owner }) {
      id
      owner
      network
      createdAt
      ink
      jsonUrl
    }
  }
`;

export const HOLDINGS_MAIN_INKS_QUERY = gql`
  query inks($inkList: [String!]) {
    inks(where: { id_in: $inkList }) {
      id
      jsonUrl
      limit
      count
      artist {
        id
        address
      }
    }
  }
`;
