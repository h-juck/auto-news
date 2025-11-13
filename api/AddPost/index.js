/* jslint node: true, esversion: 2017 */
/* globals process */
"use strict";

const { BlobServiceClient } = require("@azure/storage-blob");

const containerName = "content"; // Der Container, den wir erstellt haben
const blobName = "posts.json";    // Unsere "Datenbank"-Datei

async function getBlobClient(connectionString) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClient.getContainerClient(containerName).getBlobClient(blobName);
}

module.exports = async function (context, req) {
    const headline = req.body.headline;
    const url = req.body.url;

    if (!headline || !url) {
        context.res = { status: 400, body: "Bitte headline und url angeben." };
        return;
    }
    
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: "Storage-Verbindung nicht konfiguriert." };
        return;
    }

    try {
        const blobClient = await getBlobClient(connectionString);
        
        let posts = [];
        // 1. Versuchen, bestehende Posts zu laden
        try {
            const downloadBlockBlobResponse = await blobClient.downloadToBuffer();
            posts = JSON.parse(downloadBlockBlobResponse.toString());
        } catch (error) {
            // Wenn die Datei nicht existiert (z.B. beim ersten Mal), fangen wir mit einem leeren Array an.
            context.log("posts.json nicht gefunden, erstelle neue Datei.");
        }

        // 2. Neuen Post hinzufügen (oben, wie bei einem Blog)
        posts.unshift({
            headline: headline,
            url: url,
            timestamp: new Date().toISOString()
        });

        // 3. Aktualisierte Liste zurückschreiben
        const data = JSON.stringify(posts, null, 2); // "null, 2" macht es hübsch lesbar
        await blobClient.upload(data, data.length, {
            blobHTTPHeaders: { blobContentType: "application/json" }
        });

        context.res = { status: 200, body: "Erfolgreich gesendet." };

    } catch (error) {
        context.res = { status: 500, body: "Fehler beim Schreiben des Blobs: " + error.message };
    }
};
