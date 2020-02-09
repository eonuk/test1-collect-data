const superagent = require('superagent');
const fs = require('fs');
const path= require('path');

/** @typedef String */
const BASE_URL = 'https://api.tiingo.com/tiingo';

/** @typedef String */
const API_KEY = '<TIINGO API CODE HERE>';

/** @typedef Array.<String> */
const TICKERS = ['aapl', 'nflx', 'amzn'];

/** @typedef String */
const START_DATE = '2019-1-1';

/** @typedef String */
const END_DATE = '2019-3-31';

// -----------------------------------------------------------------------
// FUNCTIONS...

/**
 * Download historical data for the given ticker
 * @param {String} ticker The ticker to download the historical data for
 * @param {String} startDate Start date to download data for
 * @param {String} endDate End date to download data for
 * @return {Promise.<Array.<Object>>} A Promise that will resolve into an an Array of Objects signifying each day
 */

async function downloadHistoricalForTicker(ticker, startDate, endDate) {
    const resp = await superagent
    .get(`${BASE_URL}/daily/${ticker}/prices`)
    .query({
        startDate,
        endDate
    })
    .set('Authorization', API_KEY);
    return resp.body;
}

/**
 * Download all the data for each ticker in the given tickers list
 * @param {Array.<String>} tickers An array of tickers
 * @param {String} startDate Start date to download data for
 * @param {String} endDate End date to download data for
 * @return {Promise.<Object>} A Promise that will resolve into an Object containing historical data for each ticker
 */
async function downloadHistoricalForAllTickers(tickers, startDate, endDate) {
    const allData = {};
    for (ticker of tickers) {
        allData[ticker] = await downloadHistoricalForTicker(ticker, startDate, endDate);
    }
    return allData;
}



// -----------------------------------------------------------------------
// ENTRY POINT...

(async () => {
    try {
        // request all the data
        const allData = await downloadHistoricalForAllTickers(TICKERS, START_DATE, END_DATE);
        console.log(allData);

        // write to output file
        const pth = path.resolve(__dirname, 'output.json');
        fs.writeFileSync(pth, JSON.stringify(allData, undefined, 2));
    } catch (err) {
        console.error(err);
    }
})();