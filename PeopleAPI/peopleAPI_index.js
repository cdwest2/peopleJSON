// [START people_quickstart]
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('../credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Tasks API.
    authorize(JSON.parse(content), listConnectionNames);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Print the display name if available for 10 connections.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listConnectionNames(auth) {
    const service = google.people({version: 'v1', auth});
    let jsonString = "";
    service.people.connections.list({
        resourceName: 'people/me',
        pageSize: 10,
        personFields: 'names,events,photos,calendarUrls,emailAddresses,birthdays,organizations,locations,occupations,biographies,photos,urls',
        sortOrder: 'LAST_MODIFIED_DESCENDING',
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        const connections = res.data.connections;
        if (connections) {
            var jsonFull = [];
            console.log(connections.length, 'Connections:');
            connections.forEach((person) => {
                if (person.names[0] && person.names.length > 0) {
                    let dispName = person.names[0].displayName
                    console.log(dispName);
                    if(person.emailAddresses)
                    {
                        var email = person.emailAddresses[0].value
                        console.log("Email:", email);
                    }
                    var description = {
                        children: "",
                        email: email,
                        how: "",
                        next: "",
                        other: "",
                        partner: "",
                        tags: "",
                        what: "",
                        when: ""
                    };
                    if(person.birthdays)
                    {
                        let day = person.birthdays[0].date.day;
                        let month = person.birthdays[0].date.month;
                        let year = person.birthdays[0].date.year;
                        let bday = year + "-" + month + "-" + day;
                        Object.assign(description, {dob: bday});
                    }
                    if(person.urls)
                    {
                        let url = person.urls[0].value;
                        Object.assign(description, {website: url});
                    }
                    if(person.biographies)
                    {
                        let bio = person.biographies[0].value;
                        description.what = bio;
                    }

                    var profile = {
                        img: null,
                        location: "",
                        name: dispName,
                        title:""
                    }

                    if(person.photos)
                    {
                        let photo = person.photos[0].url;
                        profile.img = photo;
                    }
                    if(person.organizations) {
                        let jobTitle = person.organizations[0].title;
                        profile.title = jobTitle;
                    }

                    var jsonObj = {
                        created: Date.now()
                    };
                    Object.assign(jsonObj, {description: description});
                    var encodedID = encodeURI(email);
                    Object.assign(jsonObj, {id: encodedID})
                    Object.assign(jsonObj, {profile: profile});
                    Object.assign(jsonObj, {updated: Date.now()});
                    Object.assign(jsonObj, {url: email});

                    jsonFull.push(jsonObj);

                } else {
                    // console.log('No display name found for connection.');
                }
                /*if(person.events[person])
                {
                    console.log(person.events[0].date);
                }*/
            });
            let data = JSON.stringify(jsonFull);
            fs.writeFileSync('peopleAPI.json', data);
        } else {
            console.log('No connections found.');
        }
    });
}
// [END people_quickstart]

module.exports = {
    SCOPES,
    listConnectionNames,
};