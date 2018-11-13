const express = require('express');
const router = express.Router();
const db = require('../../model/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TOKEN_KEY = process.env.TOKEN_KEY;
const DEBUG = true;

router.post('/authorize', async function(req,res,next){
    log('Authorization request recieved');
    if(req.body.username && req.body.password){
        log('Both username and password is recieved');
        let match = null;
        let response = {};
        let username = req.body.username;
        username = username.toLowerCase();
        let password = req.body.password;
        let query = `SELECT * from "public"."users_v2" WHERE "username" = $1`;
        let queryValues = [username];
        let queryresult = await db.select(query, queryValues);
        if(queryresult.return.rowCount === 1){
            log('1 entry returned from DB');
            match = await bcrypt.compare(password, queryresult.return.rows[0].pwhash);
        }
        if(match === true){
            let token = jwt.sign({
                id: queryresult.return.rows[0].id,
                username: queryresult.return.rows[0].username,
                fullname: queryresult.return.rows[0].fullname,
                userrole: queryresult.return.rows[0].userrole
            }, TOKEN_KEY, { expiresIn: '24h' });
            response.status = 200;
            response.return = {msg:'User is authorized',userData:{
                name: queryresult.return.rows[0].username,
                email: queryresult.return.rows[0].email,
                token: token
            }};
        } else{
            response.status = 401;
            response.return = {msg:'User is NOT authorized'};
        }
        res.status(response.status).json(response.return).end();
    } else{
        res.status(400).json({error:'Error in input data, read API documentation'});
    }
});

module.exports = router;

function log(...messages) {
    if (DEBUG) {
        messages.forEach(msg => {
            console.log(msg);
        })
    }
}