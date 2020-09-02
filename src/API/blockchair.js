const createUrl = (endpoint = '') => (params = '') =>
  `${process.env.REACT_APP_BLOCKCHAIR_API_URL}${endpoint}`.concat(params);

const bitcoinStatsEndpoint = createUrl('bitcoin')();
const API_CALLS = {
  fetchStats: createUrl('stats'),
  fetchBitcoinStats: createUrl('stats/bitcoin'),
  createUrlWithoutParams: (x) => createUrl(`stats/${x}`)(),
};

export default API_CALLS;

// const fetchDataQuickly = async (time) => {
//   // Good. Fetches run in parallel.
//   const [foo, bar, baz] = await Promise.all([
//     fetchFoo(),
//     fetchBar(),
//     fetchBaz(),
//   ]);
//   return { foo, bar, baz, time: Date.now() - time };
// };

// fetchDataQuickly(Date.now()).then(({ foo, bar, baz, time }) => {
//   console.log('fetched quickly:', foo, bar, baz, time);
// });

// const fetchDataQuickly2 = async (time) => {
//   // Also good.
//   const fooReady = fetchFoo();
//   const barReady = fetchBar();
//   const bazReady = fetchBaz();

//   const foo = await fooReady;
//   const bar = await barReady;
//   const baz = await bazReady;
//   return { foo, bar, baz, time: Date.now() - time };
// };

// fetchDataQuickly2(Date.now()).then(({ foo, bar, baz, time }) => {
//   console.log('fetched quickly:', foo, bar, baz, time);
// });
