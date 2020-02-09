const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/** @typedef String */
const BASE_URL = 'https://api.tiingo.com/tiingo';

/** @typedef String */
const API_KEY = 'Token 3f054b20006b7b515e126ab1d5111d94e06613a4';

/** @typedef Array.<String> */
const TICKERS = [
    "ATVI","ADBE","AMD","ALXN","ALGN","GOOGL","GOOG","AMZN","AAL","AMGN","ADI","ANSS","AAPL",
    "AMAT","ASML","ADSK","ADP","BIDU","BIIB","BMRN","BKNG","AVGO","CDNS","CDW","CERN","CHTR","CHKP","CTAS",
    "CSCO","CTXS","CTSH","CMCSA","CPRT","CSGP","COST","CSX","DLTR","EBAY","EA","EXC","EXPE","FB","FAST",
    "FISV","GILD","IDXX","ILMN","INCY","INTC","INTU","ISRG","JD","KLAC","KHC","LRCX","LBTYA",
    "LBTYK","LULU","MAR","MXIM","MELI","MCHP","MU","MSFT","MDLZ","MNST","NTAP","NTES","NFLX","NVDA","NXPI",
    "ORLY","PCAR","PAYX","PYPL","PEP","QCOM","REGN","ROST","SGEN","SIRI","SWKS","SPLK","SBUX","SNPS","TMUS",
    "TTWO","TSLA","TXN","TCOM","UAL","VRSN","VRSK","VRTX","WBA","WDAY","WDC","WLTW","XEL","XLNX"
];

// removed: "FOXA","FOX","ULTA",

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
    const historicalData = {};
    for (ticker of tickers) {
        historicalData[ticker] = await downloadHistoricalForTicker(ticker, startDate, endDate);
        console.log(`Download: ${ticker} -> ${historicalData[ticker].length} days`);
    }
    return historicalData;
}

/**
 * Collate the data for the given ticker into a suitable format for CSV output
 * @param {String} ticker The ticker symbol
 * @param {Array.<Object>} tickerData The historical data for the given ticker
 * @return {Array} An Array representing a row of data
 */
function collateDataForTicker(ticker, tickerData) {
    const dayCollatedData = tickerData.map(day => [
            moment(day.date).format('YYYY-MM-DD'),
            ticker,
            Number(Math.round(day.open+'e2')+'e-2'),
            Number(Math.ceil(day.high+'e2')+'e-2'),
            Number(Math.floor(day.low+'e2')+'e-2'),
            Number(Math.round(day.close+'e2')+'e-2'),
        ]
    );
    return dayCollatedData;
}

/**
 * Collate the data for all the given tickers into a suitable format for CSV output
 * @param {Array.<String>} tickers An array of tickers
 * @param {Object} allData All of the historic data as a object with keys as tickers
 * @return {Array} A 2x2 Array which represents a table of data including headers
 */
function collateDataForAllTickers(tickers, allData) {
    let allCollatedData = tickers.map(ticker => collateDataForTicker(ticker, allData[ticker]));
    allCollatedData = [].concat.apply([], allCollatedData); // flatten into a table of rows

    // add the header row
    allCollatedData.unshift([
        'Date',
        'Ticker',
        'Open',
        'High',
        'Low',
        'Close',
    ]);

    return allCollatedData;
}

/**
 * Convert the collated data into a suitable string for a CSV file output
 * @param {Array} collatedData The collated data in the form of a 2x2 array (table)
 */
function convertToCSV(collatedData) {
    const rows = collatedData.map(row => row.join(','));
    return rows.join('\r\n');
}

// -----------------------------------------------------------------------
// ENTRY POINT...

(async () => {
    try {
        // 1) create output folder
        const outputPath = path.resolve(__dirname, 'output');
        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

        // 2) request all the historical data
        const historicalData = await downloadHistoricalForAllTickers(TICKERS, START_DATE, END_DATE);

        // 3) write historic data to output folder
        const hPath = path.resolve(outputPath, 'historical.json');
        fs.writeFileSync(hPath, JSON.stringify(historicalData, undefined, 2));

        // 4) collate data into suitable format
        const collatedData = collateDataForAllTickers(TICKERS, historicalData);

        // 5) write collated data to output folder
        const colPath = path.resolve(outputPath, 'collated.json');
        fs.writeFileSync(colPath, JSON.stringify(collatedData, undefined, 2));

        // 6) convert collated data to CSV string
        const csv = convertToCSV(collatedData);

        // 7) write csv to output folder
        const csvPath = path.resolve(outputPath, 'data.csv');
        fs.writeFileSync(csvPath, csv);
    } catch (err) {
        console.error(err);
    }
})();