async function getAllBooks() {
  const csvUrl = `https://raw.githubusercontent.com/DevInCube/books/master/data/books.csv`;
  const res = await fetch(csvUrl);
  const csv = await res.text();
  return $.csv.toObjects(csv);
}

const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    allBooks: [],
  },
  mounted() {
      getAllBooks().then(books => {
          this.allBooks = books;
       console.log(books);
      });
  },
});
