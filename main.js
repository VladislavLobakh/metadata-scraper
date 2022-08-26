const Apify = require('apify');

const { log } = Apify.utils;

Apify.main(async () => {
  const input = await Apify.getInput();
  const { urls = [], proxy = { useApifyProxy: false } } = input;

  if (input.url) urls.push(input.url);

  const requests = [];
  for (const url of urls) {
    if (!new URL(url)) throw new Error('All URLs must be valid URLs!');
    requests.push({ url });
  }

  const requestList = await Apify.openRequestList('start-urls', requests);
  const proxyConfiguration = await Apify.createProxyConfiguration({ ...proxy });

  const crawler = new Apify.CheerioCrawler({
    requestList,
    proxyConfiguration,
    maxConcurrency: 50,
    handlePageFunction: async ({ $, request }) => {
      const meta = {};

      for (const tag of $('head meta')) {
        const name =
          $(tag).attr('name') ||
          $(tag).attr('property') ||
          $(tag).attr('http-equiv');
        const content = $(tag).attr('content');
        if (name) meta[name] = content ? content.trim() : null;
      }

      const result = {
        url: request.url,
        title: ($('head title').text() || '').trim(),
        meta
      };

      return Apify.pushData(result);
    }
  });

  log.info('Starting the crawl...');
  await crawler.run();
  log.info(
    'Scraping finished! Metadata for each site is available in "Results".'
  );
});
