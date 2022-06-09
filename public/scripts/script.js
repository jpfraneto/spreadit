const responses = [];

document.getElementById('fetch-database').addEventListener('click', () => {
  setInterval(async () => {
    const response = await fetch('/api');
    const data = await response.json();
    responses.push(data.data);
    addColumnToTable(data.data.timestamp, data.data.markets_ticker);
  }, 2222);
});

function addColumnToTable(timestamp, newData) {
  const table = document.getElementById('mytable');
  const newrow = table.insertRow();
  let newEl;
  newEl = newrow.insertCell(0);
  newEl.innerHtml = timestamp;
  newData.forEach((x, i) => {
    console.log('here', x, i);
    newEl = newrow.insertCell(i + 1);
    newEl.innerText = x.spread[0];
  });
}
