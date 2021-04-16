import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-apollo';
import { Link } from 'react-router-dom';
import { ADMIN_NFTS_QUERY } from './apollo/queries';
import { Loader } from './components';
import { isBlocklisted } from './helpers';
import { useUserProvider } from './hooks';

const ADMIN_ADDRESSES = ['0x859c736870af2abe057265a7a5685ae7b6c94f15'];

export default function CuratedNfts({ localProvider, injectedProvider }) {
  let [allNfts, setAllNfts] = useState([]);
  let [nfts, setNfts] = useState({});
  const userProvider = useUserProvider(localProvider, injectedProvider);
  console.log('userProvider: ', userProvider);
  const { loading, error, data, fetchMore } = useQuery(ADMIN_NFTS_QUERY, {
    variables: {
      first: 48,
      skip: 0,
      admins: ADMIN_ADDRESSES,
    },
    fetchPolicy: 'no-cache',
  });

  const getMetadata = async (jsonURL) => {
    const response = await fetch('https://ipfs.io/ipfs/' + jsonURL);
    const data = await response.json();
    return data;
  };

  const getNfts = (data) => {
    setAllNfts([...allNfts, ...data]);
    data.forEach(async (nft) => {
      if (isBlocklisted(nft.jsonUrl)) return;
      let _nft = nft;
      _nft.metadata = await getMetadata(nft.jsonUrl);
      let _newNft = {};
      _newNft[_nft.nftNumber] = _nft;
      setNfts((nfts) => ({ ...nfts, ..._newNft }));
      //setNfts((nfts) => [...nfts, _nft]);
    });
  };

  const onLoadMore = useCallback(() => {
    if (
      Math.round(window.scrollY + window.innerHeight) >=
      Math.round(document.body.scrollHeight)
    ) {
      fetchMore({
        variables: {
          skip: allNfts.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return fetchMoreResult;
        },
      });
    }
  }, [fetchMore, allNfts.length]);

  // useEffect(() => {
  //   fakeData ? getNfts(fakeData.data.nfts) : console.log('loading');
  //   // eslint-disable-next-line
  // }, [fakeData]);

  useEffect(() => {
    data ? getNfts(data.nfts) : console.log('loading');
    // eslint-disable-next-line
  }, [data]);

  useEffect(() => {
    window.addEventListener('scroll', onLoadMore);
    return () => {
      window.removeEventListener('scroll', onLoadMore);
    };
  }, [onLoadMore]);

  if (loading) return <Loader />;
  if (error) return `Error! ${error.message}`;

  return (
    <div className="nfts-grid">
      {nfts &&
        Object.keys(nfts)
          .sort((a, b) => b - a)
          .map((nft) => (
            <div className="nft-item" key={nfts[nft].id}>
              <Link to={'assets/' + nfts[nft].id} style={{ color: 'black' }}>
                <img
                  src={nfts[nft].metadata.image}
                  alt={nfts[nft].metadata.name}
                />
              </Link>
            </div>
          ))}
    </div>
  );
}
