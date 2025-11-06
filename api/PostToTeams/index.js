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

    // Wir formatieren die Nachricht als "Adaptive Card"
    var card = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": headline,
        "sections": [{
            "activityTitle": headline,
            "activitySubtitle": "Neuer KI-News-Beitrag",
            "facts": [{
                "name": "Quelle",
                "value": url
            }],
            "markdown": true
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "Link öffnen",
            "targets": [{ "os": "default", "uri": url }]
        }]
    };

    try {
        var response = await fetch(TEAMS_WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify(card),
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