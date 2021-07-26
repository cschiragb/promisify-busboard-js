import { createInterface } from 'readline';
import { URL } from 'url';
import request from 'request';
import { response } from 'express';

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const POSTCODES_BASE_URL = 'https://api.postcodes.io';
const TFL_BASE_URL = 'https://api.tfl.gov.uk';

export default class ConsoleRunner {

    /* Original with callbacks */
    // promptForPostcode(callback) {
    //     readline.question('\nEnter your postcode: ', function(postcode) { // this should be inside the promise
    //         readline.close();
    //         callback(postcode);
    //     });
    // }

    promptForPostcode() {
        return new Promise((resolve) => 
            readline.question('\nEnter your postcode: ', (postcode) => resolve(postcode))
        )
    }

    displayStopPoints(stopPoints) {
        stopPoints.forEach(point => {
            console.log(point.commonName);
        });
    }

    buildUrl(url, endpoint, parameters) {
        const requestUrl = new URL(endpoint, url);
        parameters.forEach(param => requestUrl.searchParams.append(param.name, param.value));
        return requestUrl.href;
    }

    /* Original with callbacks */
    // makeGetRequest(baseUrl, endpoint, parameters, callback) {
    //     const url = this.buildUrl(baseUrl, endpoint, parameters);
    //     request.get(url, (err, response, body) => {
    //         if (err) {
    //             console.log(err);
    //         } else if (response.statusCode !== 200) {
    //             console.log(response.statusCode);
    //         } else {
    //             callback(body);
    //         }
    //     });
    // }

    makeGetRequest(baseUrl, endpoint, parameters) {
        const url = this.buildUrl(baseUrl, endpoint, parameters);
        return new Promise((resolve, reject) => {
            request.get(url, (err, response, body) => {
                if (err) {
                    reject(err);
                } else if (response.statusCode !== 200) {
                    reject(response.statusCode);
                } else {
                    resolve(body);
                }
            });
        })
    }

    /* Original with callbacks */
    // getLocationForPostCode(postcode, callback) {
    //     this.makeGetRequest(POSTCODES_BASE_URL, `postcodes/${postcode}`, [], function(responseBody) {
    //         const jsonBody = JSON.parse(responseBody);
    //         callback({ latitude: jsonBody.result.latitude, longitude: jsonBody.result.longitude });
    //     });
    // }

    getLocationForPostCode(postcode) {
        return this.makeGetRequest(POSTCODES_BASE_URL, `postcodes/${postcode}`, []).then((responseBody) => {
            const jsonBody = JSON.parse(responseBody);
            return({ latitude: jsonBody.result.latitude, longitude: jsonBody.result.longitude });
        });
    }

    /* Original with callbacks */
    // getNearestStopPoints(latitude, longitude, count, callback) {
    //     this.makeGetRequest(
    //         TFL_BASE_URL,
    //         `StopPoint`, 
    //         [
    //             {name: 'stopTypes', value: 'NaptanPublicBusCoachTram'},
    //             {name: 'lat', value: latitude},
    //             {name: 'lon', value: longitude},
    //             {name: 'radius', value: 1000},
    //             {name: 'app_id', value: '' /* Enter your app id here */},
    //             {name: 'app_key', value: '' /* Enter your app key here */}
    //         ],
    //         function(responseBody) {
    //             const stopPoints = JSON.parse(responseBody).stopPoints.map(function(entity) { 
    //                 return { naptanId: entity.naptanId, commonName: entity.commonName };
    //             }).slice(0, count);
    //             callback(stopPoints);
    //         }
    //     );
    // }

    getNearestStopPoints(latitude, longitude, count) {
        return this.makeGetRequest(
            TFL_BASE_URL,
            `StopPoint`, 
            [
                {name: 'stopTypes', value: 'NaptanPublicBusCoachTram'},
                {name: 'lat', value: latitude},
                {name: 'lon', value: longitude},
                {name: 'radius', value: 1000},
                {name: 'app_id', value: '' /* Enter your app id here */},
                {name: 'app_key', value: '' /* Enter your app key here */}
            ]).then(
            function(responseBody) {
                const stopPoints = JSON.parse(responseBody).stopPoints.map(function(entity) { 
                    return { naptanId: entity.naptanId, commonName: entity.commonName };
                }).slice(0, count);
                return stopPoints;
            }
        );
    }

    /* Original with callbacks */
    // run() {
    //     const that = this;
    //     that.promptForPostcode(function(postcode) { 
    //         postcode = postcode.replace(/\s/g, '');
    //         that.getLocationForPostCode(postcode, function(location) {
    //             that.getNearestStopPoints(location.latitude, location.longitude, 5, function(stopPoints) {
    //                 that.displayStopPoints(stopPoints);
    //             });
    //         });
    //     });
    // }

    // run() {
    //     const that = this;
    //     that.promptForPostcode()
    //         .then((postcode) => postcode.replace(/\s/g, ''))
    //         .then((cleanedPostcode) => that.getLocationForPostCode(cleanedPostcode))
    //         .then((location) => that.getNearestStopPoints(location.latitude, location.longitude, 5))
    //         .then((stopPoints) => that.displayStopPoints(stopPoints))
    //         .catch((error) => console.log(error));
    // }

    /* Using async and await rather than .then */
    async run() {
        const that = this;
        const postcode = await that.promptForPostcode();
        const cleanedPostcode = postcode.replace(/\s/g, '');
        const location = await that.getLocationForPostCode(cleanedPostcode);
        const stopPoints = await that.getNearestStopPoints(location.latitude, location.longitude, 5);
        this.displayStopPoints(stopPoints);     
    }
}