const //Secure variables
    auth_clientId = "",
    auth_clientSecret = "",
    auth_callbackURL = "",
    client_token = "";

const //Non-secure variables
    express  = require('express'),
    session  = require('express-session'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    Strategy = require('passport-discord'),
    path = require('path');
    app      = express(),
    Discord = require('discord.js'),
    client = new Discord.Client(),
    guild_id = "252486740835565568", //Alliance Navy guild ID (server)
    auth_scopes = ['identify'];

let //Scratch variables
    guild = null,
    printRoles = "";

client.login(client_token);

client.on("ready", _ => {
    console.log("DISCORD >> Connected.");
    guild = client.guilds.find(guild => guild.id===guild_id);
    if(guild  ===null) {
        console.log("DISCORD >>> WHO STOLE MY GUILD???")
        return;
    }
    printRoles ="";
    guild.roles
        .filter(role => role.editable)
        .filter(role => /^\w/.test(role.name))
        .filter(role => !role.hasPermission("ADMINISTRATOR"))
        .filter(role => !role.hasPermission("MANAGE_ROLES"))
        .filter(role => !role.hasPermission("KICK_MEMBERS"))
        .filter(role => !role.hasPermission("BAN_MEMBERS"))
        .sort((a,b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0)
    console.log(printRoles);
});

function getAssignableRoles() {
    if (guild === null || guild.available === false)
        return null;
    return guild.roles
        .filter(role => role.editable)
        .filter(role => /^\w/.test(role.name))
        .filter(role => !role.hasPermission("ADMINISTRATOR"))
        .filter(role => !role.hasPermission("MANAGE_ROLES"))
        .filter(role => !role.hasPermission("KICK_MEMBERS"))
        .filter(role => !role.hasPermission("BAN_MEMBERS"))
        .sort((a,b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
}

function getUserAssignedRoles(user) {
    return user.roles
        .filter(role => role.editable)
        .filter(role => /^\w/.test(role.name))
        .filter(role => !role.hasPermission("ADMINISTRATOR"))
        .filter(role => !role.hasPermission("MANAGE_ROLES"))
        .filter(role => !role.hasPermission("KICK_MEMBERS"))
        .filter(role => !role.hasPermission("BAN_MEMBERS"))
        .sort((a,b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
}

function getUserRoleState(user) {
    let guildRoles = getAssignableRoles();
    if (guildRoles === null) {
        console.log("guildRoles was null");
        return null;
    }
    let userRoles = getUserAssignedRoles(user);
    if (userRoles === null) {
        console.log("userRoles was null");
        return null;
    }
    return guildRoles.map(grole => {
        grole.UserHasRole = userRoles.find(urole => urole.id === grole.id) !== null;
        return grole;
    });
}

//Authentication

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new Strategy({
    clientID: auth_clientId,
    clientSecret: auth_clientSecret,
    callbackURL: auth_callbackURL,
    scope: auth_scopes
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

//Open the socket... more authentication

app.listen(5000, function (err) {
    if (err) return console.log(err)
    console.log('EXPRESS >> Listening at http://162.237.28.109:5000/')
})

app.get('/', passport.authenticate('discord', { scope: auth_scopes }), function(req, res) {});

app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }), function(req, res) { res.redirect('/roles') } // auth success
);

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/')
}

//app.get('/logout', function(req, res) {
//    req.logout();
//    res.redirect('/');
//});

//This is where the magic happens:

app.get('/roles', checkAuth, function(req, res) {
    if (guild !== null && guild.available) {
        let target_user = guild.members.find(member => member.id === req.user.id);
        let userGuildRoles = getUserRoleState(target_user);//.array();
        res.render('roles', { title: 'Role Manager - Alliance Navy Discord', pcontent: userGuildRoles, user: target_user.nickname });
    }
    else {
        console.log("DISCORD >>> WHO STOLE MY GUILD???")
        return;
    }
});

app.post('/callback_ajax', checkAuth, function(req, res) {
    //console.log(req);
    //console.log("***");
    //console.log(req.body);
    let target_user = guild.members.find(member => member.id === req.user.id);
    let target_role = guild.roles.find('id', req.body.strID);
    if (req.body.strState == false) {
        target_user.removeRole(target_role).then((gm) => {
            //console.log('Role removed');
        }).catch((e) => {
            //console.log('Failed to remove role');
            console.log(e);
        });
    }
    else if (req.body.strState == true) {
        target_user.addRole(target_role).then((gm) => {
            //console.log('Role removed');
        }).catch((e) => {
            //console.log('Failed to remove role');
            console.log(e);
        });
    }
    res.sendStatus(200);
});

//Error handling

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});