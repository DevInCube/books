function makeApiCall(sheetId, query, handlerName) {
    // Note: The below spreadsheet is "Public on the web" and will work
    // with or without an OAuth token.  For a better test, replace this
    // URL with a private spreadsheet.
    const encodedQuery = encodeURIComponent(query);
    const tqUrl = `https://docs.google.com/a/google.com` +
        `/spreadsheets/d/${sheetId}/gviz/tq` +
        `?tqx=responseHandler:${handlerName}` +
        `&tq=${encodedQuery}`;

    document.write('<script src="' + tqUrl + '" type="text/javascript"></script>');
}

function parseResponse(resp) {
    const headers = {};
    for (const [ci, col] of resp.table.cols.entries()) {
        headers[col.label] = ci;
    }
    const items = [];
    for (const row of resp.table.rows) {
        const item = {};
        for (const [key, pos] of Object.entries(headers)) {
            item[key] = row.c[pos] ? row.c[pos].v : null;
        }
        items.push(item)
    }
    return items;
}

const app = new Vue({
    el: '#app',
    data: {
        loading: true,
        allHolders: [],
        allBooks: [],
        selectedBook: null,
        filterString: ``,
        filters: {
            showRented: true,
        },
        page: 1,
        itemsPerPage: 12,
        statics: {
            defaultCoverUrl: `https://vignette.wikia.nocookie.net/summoner-the-novice/images/e/e2/Placeholder_02.png/revision/latest?cb=20180210125541`,
            defaultProfileImageUrl: `images/user-default.png`,
            goodreadsLogoUrl: `https://images-eu.ssl-images-amazon.com/images/I/61Fkb1F2vOL.png`,
            telegramLogoUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/384px-Telegram_alternative_logo.svg.png`,
            instagramLogoUrl: `https://instagram-brand.com/wp-content/uploads/2016/11/app-icon2.png`,
            gmailLogoUrl: `https://dl1.cbsistatic.com/i/r/2017/04/07/8f97f0cc-ea83-4b86-8f96-6c9519e25f44/thumbnail/64x64/a691a5bfbc1a06841bad99cc5e74e0b9/imgingest-665667076150066853.png`,
            telegramChannelLink: `https://t.me/rabooks`,
        },
        user: {
            fullname: `Руслан Гадиняк`,
            imageUrl: `images/users/rhadyniak/photo.jpg`,
            region: `Київ`,
            goodreadsLink: `https://www.goodreads.com/user/show/51764433-ruslan-hadyniak`,
            telegramLink: `https://t.me/rhadyniak`,
            instagramLink: `https://www.instagram.com/rhadyniak/`,
            emailLink: `ruslan.hadyniak@gmail.com`,
        },
    },
    computed: {
        filteredBooks() {
            const filteredBooks = this.allBooks
                .filter(x =>
                    (this.filters.showRented || !x.isRented)
                    && (this.filterString.trim() === '' 
                        || `${x.title} ${x.author} ${x.holder.fullname}`.toLowerCase().includes(this.filterString.toLowerCase())));
            filteredBooks.sort((a, b) => ('' + a.title).localeCompare(b.title));
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
        makeApiCall(`1ldXL8zCdfFbP1I_tt04I4AOjirGDIDJBTB2Xcucm-S4`, `SELECT *`, `handleUsersResponse`);
    },
    methods: {
        setHolders(holders) {
            this.allHolders = holders.filter(x => x.isEnabled);
            const firstHolder = this.allHolders[0];
            if (firstHolder) {
                const linkPrefix = "link.";
                for (const holder of this.allHolders) {
                    holder.links = Object.entries(holder)
                        .filter(([key, val]) => key.startsWith(linkPrefix) && val)
                        .map(([key, val]) => ({
                            service: key.substr(linkPrefix.length),
                            id: val,
                        }))
                        .map(link => ({
                            service: link.service,
                            id: link.id,
                            serviceName: getServiceName(link),
                            url: getServiceUrl(link),
                            logoUrl: getServiceLogoUrl(link),
                        }));
                }
                console.log(this.allHolders);

                function getServiceName(link) {
                    switch (link.service) {
                        case "telegram": return `Telegram`;
                        case "email": return `email`;
                        case "instagram": return `Instagram`;
                        default: return `#`;
                    }
                }

                function getServiceUrl(link) {
                    switch (link.service) {
                        case "telegram": return `https://t.me/${link.id}`;
                        case "email": return `mailto:${link.id}`;
                        case "instagram": return `https://www.instagram.com/${link.id}`;
                        default: return `#`;
                    }
                }

                function getServiceLogoUrl(link) {
                    switch (link.service) {
                        case "telegram": return app.statics.telegramLogoUrl;
                        case "email": return app.statics.gmailLogoUrl;
                        case "instagram": return app.statics.instagramLogoUrl;
                        default: return `#`;
                    }
                }
            }
            
            makeApiCall(`1DgBafRgaXklhdDGfMzJOBfTGvCwjjluW-LhWYhDuksQ`, `SELECT *`, `handleTqResponse`);
        },
        setBooks(books) {
            for (const book of books.filter(x => validateBook(x))) {
                const holder = this.allHolders.find(x => x.id === book.holderId);
                if (holder) {
                    book.holder = holder;
                    this.allBooks.push(book);
                }
            }
            this.loading = false;

            function validateBook(book) {
                return book.isAvailable
                    && book.author
                    && book.title
                    && book.holderId;
            }
        },
        toggleRented(e) {
            this.filters.showRented = !this.filters.showRented;
        },
        reloadPage() {
            location.reload();
        },
        clearFilter(e) {
            this.filterString = ``;
        },
        filterByContents(e) {
            const contents = e.target.innerText;
            this.filterString = contents.trim();
        },
        filterByHolder(e) {
            const contents = e.target.innerText;
            this.filterString = contents.trim();
        },
        selectBook(book) {
            this.selectedBook = book;
        },
        prevPage() { this.page -= 1; },
        nextPage() { this.page += 1; },
        firstPage() { this.page = 1; },
        lastPage() { this.page = this.pages; },
    }
});

function handleTqResponse(resp) {
    app.setBooks(parseResponse(resp));
}

function handleUsersResponse(resp) {
    app.setHolders(parseResponse(resp));
}

const aboutMd = `
Це повністю безплатний проект, що дозволить тобі позичати в мене книги.  
Домовляємося про зручну для мене локацію зустрічі в моєму місті і я принесу обрані тобою книги.  
`;
document.getElementById("about").innerHTML = mdToHtml(aboutMd);

const qa = (q, a) => `#### _"${q}"_\r\n\r\n${a}`;
const qalist = [
    [
        `Я теж хочу позичати людям книги! Чи можу я приєднатись до проекту?`,
        `Так, обов'язково напиши мені про це і в тебе з'явиться сторінка з власними книгами!`,
    ],
    [
        `Я хочу пожертвувати проекту книгу. Чи можу я це зробити?`,
        `Так, буду вдячний за розширення бібліотеки. Твоє ім'я буде додано (опціонально) до опису книги і відображатиметься на сайті`,
    ],
]
const qaMd = `
###  Питання, які могли в тебе виникнути:
${qalist.map(x => qa(x[0], x[1])).join('\r\n')}
`;
document.getElementById("qa").innerHTML = mdToHtml(qaMd);

function mdToHtml(md) {
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();
    var parsed = reader.parse(md); // parsed is a 'Node' tree
    // transform parsed if you like...
    var result = writer.render(parsed); // result is a String
    return result;
}

$('#borrowModal').on('shown.bs.modal', function (e) {
    const bookModalBody = document.getElementById('book-modal-body');
    bookModalBody.scrollTop = 0;
})