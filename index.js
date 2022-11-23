import express from 'express';
import { engine } from 'express-handlebars';

import flash from 'express-flash';
import session from 'express-session';

import Pgp from 'pg-promise';
import ShortUniqueId from 'short-unique-id';
import spazaSuggest from './spaza-suggest.js';


const app = express();
const pgp = Pgp();
const uid = new ShortUniqueId({ length: 5 });
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

// initialise session middleware - flash-express depends on it
app.use(session({
    secret: "kay",
    resave: false,
    saveUninitialized: true
}));

// initialise the flash middleware
app.use(flash());
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://zuggs:suggest123@localhost:5432/spaza_suggest";

const config = {
    connectionString: DATABASE_URL
}

if (process.env.NODE_ENV == 'production') {
    config.ssl = {
        rejectUnauthorized: false
    }
}

const db = pgp(config);
app.use(function (req, res, next) {

    const noLoginNeeded = {
        '/login' : true,
        '/register' : true,
        // '/admin' : true,
    };

    if (noLoginNeeded[req.path]) {
        next();
    } else {

        // add a road block - or check before we proceed.
        if (!req.session.user) {
            res.redirect('/login');
            return;
        }
        next();
    }

});
app.get('/logout', function (req, res) {
    delete req.session.user;

    res.redirect('/login');

})
app.get("/", async (req, res) => {

    // no longer checking the username...

const findearas= await spazaSuggest.areas();
const ereaSug= await spazaSuggest.suggestProduct(areaId, clientId, suggestion);
const suggestionsclientId = await spazaSuggest.suggestions(clientId)


    

    res.render("index", {
        user: req.session.user,
      findearas,
      ereaSug,
      suggestionsclientId
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    let { username } = req.body;

    if (username) {
        // create a unique code foe the user.
        const uniqCode = uid();
        username = username.toLowerCase();
        // check if the user is in the database - if so return an error

        const findclientUser = "select count(*) from spaza_client where username = $1";
        const result = await db.one(findclientUser, [username]);

        if (Number(result.count) !== 0) {
            req.flash('error', `Username already exists - ${username}`);
        } else {
            // insert the user in the database...
           const client=await spazaSuggest.registerClient(username)
         // show a message that the user was added
        req.flash('success', 'User was added - use this code : ' + uniqCode);
        }

    } else {
        req.flash('error', 'No username provided');
    }

    res.redirect('/register');

});


app.get('/login', async (req, res) => {
    res.render('login');
});


app.post('/login', async (req, res) => {

    const { code } = req.body;
    if (code) {
        // is the code valid?
        // how do I knw a code is valid...

        const findclientByCode = `select * from spaza_client where code = $1`;
        const user = await db.oneOrNone(findclientByCode, [code]);
        if (user) {
            
            req.session.user = user;
            res.redirect('/');
            return;
        }
    }

    req.flash('error', 'Invalid user code');
    res.render('login');


});
app.get('/registerSpaza', (req, res) => {
    res.render('registerSpaza');
});

app.post('/registerSpaza', async (req, res) => {
    let { username } = req.body;
          let {areaId}= req.body;
    if (username && areaId) {
        // create a unique code foe the user.
        const code = uid();
        username = username.toLowerCase();
        // check if the user is in the database - if so return an error

        const findspazaUser = "select count(*) from spaza where username = $1";
        const result = await db.one(findclientUser, [username]);

        if (Number(result.count) !== 0) {
            req.flash('error', `Username already exists - ${username}`);
        } else {
            // insert the user in the database...
           await spazaSuggest.registerSpaza(name, areaId)

            // show a message that the user was added
            req.flash('success', 'User was added - use this code : ' + code);
        }

    } else {
        req.flash('error', 'No username provided');
    }

    res.redirect('/registerSpaza');

});


app.get('/spazaLogin', async (req, res) => {
    res.render('spazaLogin');
});


app.post('/spazaLogin', async (req, res) => {

    const { code } = req.body;
    if (code) {
        // is the code valid?
        // how do I knw a code is valid...

        
        const userSpaza = await spazaSuggest.spazaLogin(code)
        if (userSpaza) {
            
            req.session.userSpaza = userSpaza;
            res.redirect('/');
            return;
        }
    }

    req.flash('error', 'Invalid spazaLogin code');
    res.render('spazaLogin');


});

app.get('/acceptSuggestion', async (req, res) => {

await spazaSuggest.acceptSuggestion(suggestionId, spazaId)

 res.redirect('/');
    

})

app.get('/acceptedSuggestions', async (req, res) => {

await spazaSuggest.acceptedSuggestions(spazaId)

 res.redirect('/');
    

})

app.post('/suggestions', async (req, res) => {

await spazaSuggest.suggestions(clientId)
 res.redirect('/');
    

})



const PORT = process.env.PORT | 3011;

app.listen(PORT, () => {

    console.log(`App started on ${PORT}`)
})