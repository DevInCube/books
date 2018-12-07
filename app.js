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

books.get()
   .then(toList)
   .then(x => Promise.all(x.map(book => populateReference(book, "author"))))
   .then(books => {
     for (const book of books) {
       document.write(`<br>"${book.data.title}" by <b>${book.author.data.fullname}</b>`);
     }
   });
