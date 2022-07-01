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
  <th>Price</th>
  <th>Count Diff</th>
  <th>Count</th>
</tr>
  `;
}

function getRelativeOrderTableRow(relativeOrder) {
  return `
  <tr>
    <td>${relativeOrder.price}</td>
    <td>${relativeOrder.countDiff || ''}</td>
    <td>${relativeOrder.count}</td>
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

chrome.runtime.onMessage.addListener((message) => {
  if (message.url) {
    document.getElementById('getStats').value = message.url;
    document.getElementById('getStats').innerHTML = 'Get Stats';
  }
});

document.getElementById('getStats').addEventListener('click', async (event) => {
if (event.target.value) {
    const relativeSellOrders = await run(event.target.value);
    renderTable(relativeSellOrders);
  }
});
