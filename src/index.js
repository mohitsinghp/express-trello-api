const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { startDatabase } = require('./database/mongo');
const { insertTrelloList, getTrelloList, deleteTodo, updateTodo } = require('./database/trellodb');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

const users = [
    {
        username: 'steve',
        password: 'wonder321',
        role: 'admin'
    },
    {
        username: 'arnold',
        password: 'Abc123',
        role: 'member'
    }
];

const accessTokenSecret = 'youraccesstokensecret';

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => { return u.username === username && u.password === password });

    if (user) {
        const accessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret);

        res.json({
            accessToken
        });
    } else {
        res.send('Username or password incorrect');
    }
});

const authenticateJWT = (req, res, next) => {
    // const authHeader = req.headers.authorization;

    // if(authHeader) {
    //     const token = authHeader.split(' ')[1];

    //     jwt.verify(token, accessTokenSecret, (err, user) => {
    //         console.log(err);
    //         if(err) {
    //             return res.sendStatus(403);
    //         }
    //         req.user = user;
    //         next();
    //     });
    // } else {
    //     res.sendStatus(401);
    // }
    next();
};


app.post('/valid', authenticateJWT, async (req, res) => {
    res.send({ message: 'Valid Token' });
})

app.get('/', authenticateJWT, async (req, res) => {
    res.send(await getTrelloList());
});

app.delete('/:id', authenticateJWT, async (req, res) => {
    const { role } = req.user;

    if (role !== 'admin') {
        return res.sendStatus(403);
    }
    await deleteTodo(req.params.id);
    res.send({ message: 'Todo Removed.' });
})

app.put('/:id', authenticateJWT, async (req, res) => {
    const updatedTodo = req.body;
    await updateTodo(req.params.id, updatedTodo);
    res.send(await getTrelloList());
})

startDatabase().then(async () => {
    await insertTrelloList({
        list: [
        //     title: "last episode",
        //     id: `list-${0}`,
        //     cards: [
        //         {
        //             id: `card-${0}`,
        //             text: "we created a static list and a static card"
        //         },
        //         {
        //             id: `card-${1}`,
        //             text: "we used a mix between materila UI and React styled components"
        //         }
        //     ]
        // },
        // {
        //     title: "This episode",
        //     id: `list-${1}`,
        //     cards: [
        //         {
        //             id: `card-${2}`,
        //             text: "We will create our first reducer"
        //         },
        //         {
        //             id: `card-${3}`,
        //             text: "render many cards on our list with static data"
        //         },
        //         {
        //             id: `card-${4}`,
        //             text: "some little changes forgot in the previous list"
        //         }
            // ]
        // }
        ]
    });

    // await insertTrelloList();

    app.listen(3001, () => {
        console.log('listening on port 3001');
    });
});