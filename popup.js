const COUNT_DIFF = 1;
const STEAM_TAX = 1.15; // might differ from game to game

function renderTable(relativeSellOrders) {
  const tableElement = document.getElementById('relativeSellOrders');
  tableElement.innerHTML = getRelativeOrderTableHeader();
  relativeSellOrders.forEach(relativeOrder => {
    tableElement.innerHTML += getRelativeOrderTableRow(relativeOrder);
  });
}

function getRelativeOrderTableHeader() {
  return `
<tr>
  <th>Count</th>
  <th>Count Diff</th>
  <th>Price</th>
  <th>Recieve</th>
</tr>
  `;
}

function getRelativeOrderTableRow(relativeOrder) {
  return `
  <tr>
    <td>${relativeOrder.count}</td>
    <td>${relativeOrder.countDiff || 0}</td>
    <td>${relativeOrder.price}</td>
    <td>${relativeOrder.recieveAmount}</td>
  </tr>
  `;
}

const orderHistogramUrl = new URL('https://steamcommunity.com');
orderHistogramUrl.pathname = '/market/itemordershistogram';

async function run(url) {
  const itemOrderHistogram = await fetch(url).then(response => response.json());

  const sellOrders = mapToSellOrders(itemOrderHistogram.sell_order_graph);

  const relativeSellOrders = createRelativeSellOrders(
    sellOrders, {
      minCountDiff: COUNT_DIFF
    }
  );

  return relativeSellOrders;
}

function mapToSellOrders(sellOrderGraph) {
  return sellOrderGraph.map(sellOrder => ({
    price: sellOrder[0],
    count: sellOrder[1],
  }));
}

function createRelativeSellOrders(sellOrders, options) {
  const relativeSellOrders = [sellOrders[0]];
  relativeSellOrders[0].recieveAmount = roundCurrency(relativeSellOrders[0].price / STEAM_TAX);

  const sellOrdersLength = sellOrders.length;
  for (let i = 1; i < sellOrdersLength; i++) {
    let relativeOrder = {
      countDiff: sellOrders[i].count - sellOrders[i - 1].count,
      price: sellOrders[i].price,
      recieveAmount: roundCurrency(sellOrders[i].price / STEAM_TAX),
      count: sellOrders[i].count,
    };

    if (options.minCountDiff && relativeOrder.countDiff > options.minCountDiff) {
      relativeSellOrders.push(relativeOrder);
    }
  }

  return relativeSellOrders;
}

function roundCurrency(amount) {
  return Math.ceil((amount + Number.EPSILON) * 100) / 100;
}

async function getOrdersAndRenderTable(histogramUrl) {
  const relativeSellOrders = await run(histogramUrl);
  renderTable(relativeSellOrders);
};

window.onload = async () => {
  let storage =  await chrome.storage.session.get(['histogramUrl']);
  if (!storage.histogramUrl) {
    chrome.storage.session.onChanged.addListener(async () => {
      storage = await chrome.storage.session.get(['histogramUrl']);
      getOrdersAndRenderTable(storage.histogramUrl);
    });
  } else {
    getOrdersAndRenderTable(storage.histogramUrl);
  }
};
