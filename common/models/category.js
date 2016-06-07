var _ = require('lodash');
var Promise = require('bluebird');
var app = require('../../server/server.js');

module.exports = function(Category) {
    Category.getCategoryBooks = function(categoryAlias, cb) {
        var categoryInfoObj = { name: null,
                                bookCount: null,
                                books: [] };
        // get the category name and the number of book count
        var getRefromedBooks = Category.findOne({where: {alias: categoryAlias}})
        .then(function(category){
            categoryInfoObj.name = category.name;
            categoryInfoObj.bookCount = category.books_id.length;
            return category.books_id;
        })
        .then(function(booksId){
            //get the books id and start to construct books
            return Promise.map(booksId, function(bookId){
                var reformedBook = { id: null,
                                     title: null,
                                     alias: null,
                                     authors: [],
                                     amazonPage: null };

                reformedBook.id = bookId;
                return reformedBook;
            })
        })
        var getBooks = app.models.Book.find()
        .then(function(books){
            return books;
        })
        var getRecommendations = app.models.Recommendation.find()
        .then(function(recommendations){
            return recommendations;
        })
        var getEggheads = app.models.EggHead.find()
        .then(function(eggheads){
            return eggheads;
        })
        return Promise.all([getRefromedBooks, getBooks, getRecommendations, getEggheads])
        .then(function(promises){
            var reformedBooks = promises[0],
                books = promises[1],
                recommendations = promises[2],
                eggheads = promises[3],
                fullBooks = null,
                fullRecommendations = null,
                reformedRecommendations = null,
                blankRecommendations = null,
                uniqReformedRecommendations = null,
                uniqRecommendations = null;

            fullBooks = reformedBooks.map(function(reformedBook){
                books.forEach(function(book){
                    if (reformedBook.id === book.id) {
                        reformedBook.title = book.title;
                        reformedBook.authors = book.authors;
                        reformedBook.alias = book.alias;
                        reformedBook.recommendations = [];
                    }
                })
                return reformedBook;
            })

            blankRecommendations = recommendations.map(function(recommendation){
                var reformedRecommendation = { recommendations: [] };
                eggheads.forEach(function(egghead){
                    if (recommendation.egghead_id === egghead.id) {
                        reformedRecommendation.bookId = recommendation.book_id;
                    }
                })
                return reformedRecommendation;
            })

            uniqReformedRecommendations = _.uniqBy(blankRecommendations, 'bookId');

            reformedRecommendations = recommendations.map(function(recommendation){
                var reformedRecommendation = {};
                eggheads.forEach(function(egghead){
                    if (recommendation.egghead_id === egghead.id) {
                        reformedRecommendation.bookId = recommendation.book_id;
                        reformedRecommendation.eggheadName = egghead.name;
                        reformedRecommendation.src = recommendation.src;
                    }
                })
                return reformedRecommendation;
            })

            fullRecommendations = uniqReformedRecommendations.map(function(uniqRecommendation){
                reformedRecommendations.forEach(function(reformedRecommendation){
                    if (uniqRecommendation.bookId === reformedRecommendation.bookId) {
                        uniqRecommendation.recommendations.push(reformedRecommendation);
                    }
                })
                return uniqRecommendation;
            })

            return fullBooks.map(function(book){
                fullRecommendations.forEach(function(recommendation){
                    if (book.id === recommendation.bookId) {
                        book.recommendations = recommendation.recommendations;
                    }
                })
                return book;
            })
        })
        .then(function(books){
            categoryInfoObj.books = books;
            cb(null, categoryInfoObj);
        })
    }
    Category.getCatgoriesInfo = function(options, cb) {
        return Category.find().then(function(categories){
            return categories.map(function(category){
                var reformedCategory = {};
                reformedCategory.name = category.name;
                if (category.books_id) {
                    reformedCategory.bookCount = category.books_id.length;
                }
                if (category.alias) {
                    reformedCategory.alias = category.alias;
                }
                return reformedCategory;
            })
        }).then(function(categories){
            console.log("rendering all categories' info...");
            cb(null, categories);
        })
        .catch(function(e){
            console.log(e);
        })
    }
    Category.remoteMethod ('getCategoryBooks', {
        description: 'get a list of books from a selcted category',
        http: {path: '/getCategoryBooks', verb: 'get', status: 200},
        accepts: {arg: 'filter', type: 'string', description: "Filter defining fields, where, include, order, offset, and limit", http: {source: 'query'}},
        returns: {arg: 'category info and its books', type: Category, root: true}
    });
    Category.remoteMethod ('getCatgoriesInfo', {
        description: 'get a list of all categories',
        http: {path: '/getCatgoriesInfo', verb: 'get', status: 200},
        accepts: {arg: 'category', type: 'string', description: 'Category ', http: {source: 'query'}},
        returns: {arg: 'category info and its books', type: Category, root: true}
    });
};