import React, { useEffect, useState } from 'react';
import { bitcoinStatsEndpoint, createUrl } from '../../API/blockchair';
const Data = ({ blocks, transactions, outputs, best_block_hash }) => (
  <>
    <p>Blocks: {blocks}</p>
    <p>transactions: {transactions}</p>
    <p>outputs: {outputs}</p>
    <p>best_block_hash: {best_block_hash}</p>
  </>
);
const ChainData = ({ chain = '', onClick, onInitFetch, data = [] }) => {
  return (
    <div>
      <h2>{chain} Data</h2>
      <button onClick={onClick}> Stop Data Fetch </button>

      <button onClick={onInitFetch}> Start Data Fetch </button>
      {data.length !== 0
        ? Object.values(data).map(({ data, ...rest }, i) => {
            console.log({ data, rest });
            return (
              <div key={i}>
                <Data {...data} />
              </div>
            );
          })
        : null}
    </div>
  );
};

export default ChainData;
