const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

const books = firestore.collection("books");

function toList(fbres) {
 const mains = [];
 fbres.forEach(b => mains.push(b));
 return mains;
}

async function populateReference(b, referenceKey) {
 const sub = await b.data()[referenceKey].get();
 return {
   id: b.id,
   data: b.data(),
   [referenceKey]: {
     id: sub.id,
     data: sub.data(),
   },
 };
}

async function getAllBooks() {
  const fbres = await books.get();
  return Promise.all(toList(fbres).map(book => populateReference(book, "author")));
}

const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    allBooks: [],
  },
  mounted() {
      getAllBooks().then(books => this.allBooks = books);
  },
});
