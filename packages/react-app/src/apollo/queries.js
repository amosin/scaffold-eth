import { gql } from "apollo-boost";

export const CREATORS_QUERY = gql`
  query creators($address: Bytes!) {
    creators(where: { address: $address }) {
      id
      nftCount
      address
      nfts(orderBy: createdAt, orderDirection: desc) {
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

export const NFTS_QUERY = gql`
  query nfts($first: Int, $skip: Int) {
    nfts: files(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      nftNumber
      createdAt
      mintPrice
      count
      limit
      jsonUrl
      creator {
        id
        address
      }
    }
  }
`;

export const EXPLORE_QUERY = gql`
  query nfts($first: Int, $skip: Int, $orderBy: String, $orderDirection: String, $filters: Nft_filter, $liker: String) {
    nfts(first: $first, skip: $skip where: $filters, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      nftNumber
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
      creator {
        id
        address
      }
    }
  }
`;

export const NFT_LIKES_QUERY = gql`
query likes($nfts: [BigInt], $liker: String) {
  nfts(first: 1000, where: {nftNumber_in: $nfts}) {
    id
    nftNumber
    likeCount
    likes(where: {liker: $liker}) {
      id
    }
  }
}`


export const ADMIN_NFTS_QUERY = gql`
    query nfts($first: Int, $skip: Int, $admins: [String!]) {
        nfts: files(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc, where: { likers_contains: $admins }) {
            id
            nftNumber
            createdAt
            jsonUrl
            creator {
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
      nft {
        id
        jsonUrl
        limit
        count
        creator {
          id
          address
        }
      }
    }
  }
`;

export const NFT_QUERY = gql`
  query nft($nftUrl: String!) {
    metaData(id: "blockNumber") {
      id
      value
    }
    nft: file(id: $nftUrl) {
      id
      nftNumber
      jsonUrl
      creator {
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

export const NFT_MAIN_QUERY = gql`
  query token($nftUrl: String!) {
    tokens(where: { nft: $nftUrl }) {
      id
      owner
      nft
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
      nft
      jsonUrl
    }
  }
`;

export const HOLDINGS_MAIN_NFTS_QUERY = gql`
  query nfts($nftList: [String!]) {
    nfts(where: { id_in: $nftList }) {
      id
      jsonUrl
      limit
      count
      creator {
        id
        address
      }
    }
  }
`;
