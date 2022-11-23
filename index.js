import express from 'express';
import { engine } from 'express-handlebars';

import flash from 'express-flash';
import session from 'express-session';

import Pgp from 'pg-promise';
import ShortUniqueId from 'short-unique-id';

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

    // console.log(r);
    // console.log('in my middleware...' + req.path);

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
