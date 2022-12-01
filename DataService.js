const logger = require('./utills').logger;
const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const fs = require('fs/promises');

const elasticClient = new Client({
  node: config.get('Elastic.url'),
});

const dataIndex = 'starlink-data';

const insertDataToElastic = async (data) => {
  await elasticClient.helpers.bulk({
    datasource: data,
    refresh: true,
    onDocument(doc) {
      if (doc.delete_date) {
        return { delete: { _index: dataIndex, _id: doc.id } };
      }
      return [
        { update: { _index: dataIndex, _id: doc.id } },
        { doc_as_upsert: true },
      ];
    },
  });
};

let cursor = undefined;

const GetLatestCursor = async () => {
  if (cursor == undefined) {
    try {
      const data = JSON.parse(await fs.readFile('./state.json'));
      cursor = data.latest_cursor;
    } catch (error) {
      logger.error(error);
    }
  }

  return cursor;
};

const SetLatestCursor = async (newCursor) => {
  logger.info(`Setting new cursor: ${newCursor}`);
  cursor = newCursor;
  await fs.writeFile('./state.json', JSON.stringify({ latest_cursor: cursor }));
};

const ProcessData = async (data) => {
  logger.info('Started processing data');

  if (data.length > 0) {
    try {
      await insertDataToElastic(data);
      const newCursor = Math.max(...data.map((dt) => dt.cursor));
      await SetLatestCursor(newCursor);
      logger.info('Finished processing data');
    } catch (error) {
      logger.error('Failed to process data');
      logger.error(error);
    }
  }
};

module.exports = { ProcessData, GetLatestCursor };
