function makeApiCall(sheetId, query) {
  // Note: The below spreadsheet is "Public on the web" and will work
  // with or without an OAuth token.  For a better test, replace this
  // URL with a private spreadsheet.
  const encodedQuery = encodeURIComponent(query);
  const tqUrl = `https://docs.google.com/a/google.com` + 
        `/spreadsheets/d/${sheetId}/gviz/tq` + 
        `?tqx=responseHandler:handleTqResponse` + 
        `&tq=${encodedQuery}`;

  document.write('<script src="' + tqUrl +'" type="text/javascript"></script>');
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
    loading: true,
    allBooks: [],
    filterString: ``,
    filters: {
        showRented: true,
    },
    page: 1,
    itemsPerPage: 10,
    statics: {
        defaultCoverUrl: `https://vignette.wikia.nocookie.net/summoner-the-novice/images/e/e2/Placeholder_02.png/revision/latest?cb=20180210125541`,
        goodreadsLogoUrl: `https://images-eu.ssl-images-amazon.com/images/I/61Fkb1F2vOL.png`,
        telegramLogoUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/384px-Telegram_alternative_logo.svg.png`,
    },
    user: {
        fullname: `Ruslan Hadyniak`,
        imageUrl: `https://cdn4.telesco.pe/file/G0iSz_GIOUdLRdXC-5-0J9FI2En6EOP2yPQavVtUgq6iAkUOFSu4A-XX_wWkUw1PglWsRObhcjKNmRUMLZbDPdpvqEN-i6YUDED__qRChpyiIT_qcymGQK_wqhRENxYpf4qJAjOFOoUMto-FFac2sLbj8Cmmu6QQxV9BOwhhe2ry51w1-7ASL4WKV5ecus5DOF5dq19d8tbkeG_iANnq09vklxZhZG3Sl9xdx1DOQLDrkECuQ7PX4bwRHjcnvQraFU4rmDE1m5kWczEsHfaPbmcAPCrUbz2DKNZgjNTYG4-INcogAVivB3cFdPXY5uyiZosjQVeJAQ2NxkX5kQAVHA.jpg`,
        region: `Kyiv`,
        goodreadsLink: `https://www.goodreads.com/user/show/51764433-ruslan-hadyniak`,
        telegramLink: `https://t.me/rhadyniak`,
    }
  },
  computed: {
    filteredBooks() {
        const filteredBooks = this.allBooks
            .filter(x => 
                (this.filters.showRented || !x.isRented) 
                && `${x.title} ${x.author}`.includes(this.filterString));
        return filteredBooks;
    },
    pages() {
        const filteredBooks = this.filteredBooks;
        const pages = Math.ceil(filteredBooks.length / this.itemsPerPage);
        return pages;
    },
    pageBooks() {
        const filteredBooks = this.filteredBooks;
        const pages = this.pages;
        if (this.page > pages) this.page = pages;
        if (this.page < 1) this.page = 1;
        const from = (this.page - 1) * this.itemsPerPage;
        return filteredBooks.slice(from, from + this.itemsPerPage);
    },
    notFound() { return !this.loading && this.filteredBooks.length === 0; }
  },
  mounted() {
      makeApiCall(`14xSwU7g8-8F88IBdO2rhoH8PJ6BTJf0yqeThlKVX9mY`, `SELECT *`);
  },
  methods: {
    setBooks(books) {
        this.allBooks = books.filter(x => x.isAvailable);
        this.loading = false;
    },
    toggleRented(e) {
        this.filters.showRented = !this.filters.showRented;
    },
    clearFilter(e) {
        this.filterString = ``;
    },
    filterByContents(e) {
        const contents = e.target.innerText;
        this.filterString = contents.trim();
    },
    prevPage() {
        this.page -= 1;
    },
    nextPage() {
        this.page += 1;
    },
  }
});

function handleTqResponse(resp) {
    app.setBooks(parseBooks(resp));
}
