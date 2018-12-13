function makeApiCall(sheetId, query, callback) {
  // Note: The below spreadsheet is "Public on the web" and will work
  // with or without an OAuth token.  For a better test, replace this
  // URL with a private spreadsheet.
  const encodedQuery = encodeURIComponent(query);
  const tqUrl = `https://docs.google.com/spreadsheets` +
      `/d/${sheetId}/gviz/tq` +
      `?tqx=responseHandler:handleTqResponse` +
      `&tq=${encodedQuery}`;

  document.write('<script src="' + tqUrl +'" type="text/javascript"></script>');
    
  function handleTqResponse(resp) {
      callback(null, resp);
  }
}


function parseBooks(resp) {
    const headers = {};
    for (const [ci, col] of resp.table.cols.entries()) {
        headers[col.label] = ci;
    }
    const books = [];
    for (const row of resp.table.rows) {
        const book = {};
        for (const [key, pos] of Object.entries(headers)) {
            book[key] = row.c[pos] ? row.c[pos].v : null;
        }
        books.push(book)
    }
    return books;
}

const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    allBooks: [],
  },
  mounted() {
      makeApiCall(`14xSwU7g8-8F88IBdO2rhoH8PJ6BTJf0yqeThlKVX9mY/gviz`, 
            `SELECT *`, 
            (err, resp) => {
                const books = parseBooks(resp);
                this.allBooks = books;
                console.log(books);
            });
  },
});
