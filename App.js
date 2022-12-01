const config = require('config');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const logger = require('./utills').logger;

const dataService = require('./DataService');

const Application = () => {
  const DataFetcher = async () => {
    logger.info('Sending synchronization request!');
    const url = new URL(config.get('ExternalDataEndpoint'));
    const params = { cursor: await dataService.GetLatestCursor() };
    url.search = new URLSearchParams(params).toString();

    try {
      const response = await fetch(url);
      const data = await response.json();
      logger.info(`Received ${data.length} changes!`);

      if (data.length > 0) {
        dataService.ProcessData(data);
      }
    } catch (error) {
      console.log(error);

      logger.error(error);
    }
  };

  const Start = async () => {
    logger.info('Application started');
    setInterval(DataFetcher, Number(config.get('SyncRequestInterval')) * 1000);
  };

  return { Start };
};

module.exports = Application;
