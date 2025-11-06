/* jslint node: true, esversion: 2017 */
/* globals require, module, process */

var fetch = require('node-fetch');

module.exports = async function (context, req) {
    "use strict"; // JSLint mag das auch
    
    var headline = req.body.headline;
    var url = req.body.url;
    
    // Die URL wird sicher aus den Umgebungsvariablen geholt
    var TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

    if (!TEAMS_WEBHOOK_URL) {
        context.res = { status: 500, body: "Webhook URL nicht konfiguriert." };
        return;
    }

    // !!! START DEBUGGING-TEST !!!
    // Wir senden ein GANZ ECHTES Text-JSON, um die "Card" als Fehlerquelle auszuschließen.
    var simpleMessage = {
        "text": "TESTNACHRICHT --- Überschrift: " + headline + " --- URL: " + url
    };
    // !!! ENDE DEBUGGING-TEST !!!

    try {
        var response = await fetch(TEAMS_WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify(simpleMessage), // Wir senden die simple Nachricht
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error("Teams API Fehler: " + response.statusText);
        }
        context.res = { status: 200, body: "Erfolgreich gesendet." };

    } catch (error) {
        context.res = { status: 500, body: "Fehler: " + error.message };
    }
};
