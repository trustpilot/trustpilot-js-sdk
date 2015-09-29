'use strict';

let request = require('request-promise');

class AccessProvider {
  constructor (apiKey, host, secret) {
    this.apiKey = apiKey;
    this.host = host;
    this.secret = secret;

    //holds the token promise so we don't generate many
    let generateTokenPromise;
  }

  //generates a new new oauth token object only if there is no generateTokenPromise set
  //returns just the access_token
  generateToken () {
    if (!this.generateTokenPromise) {

      this.generateTokenPromise = request({
        baseUrl: this.host,
        uri: '/v1/oauth/system-users/token',
        method: 'POST',
        json: true,
        headers: {
          Authorization: 'Basic ' + new Buffer(this.apiKey + ':' + this.secret).toString('base64'),
          'X-Access': new Buffer('{type: "Full"}').toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      }).then((response) => {
        this.authorization = response;
        return response.access_token;
      });
    }

    return this.generateTokenPromise;
  }

  getToken () {
    return new Promise((resolve, reject) => {

      //auth token isn't set
      if (!this.authorization) {
        this.generateToken().then((responseToken) => {
          resolve(responseToken);

        });

        //about to expire - clear promise and get new one
      } else if (this.authorization.expires_in < 5) {
        delete this.generateTokenPromise;

        this.generateToken().then((responseToken) => {
          resolve(responseToken);
        });

        //auth token is available so resolve with the token
      } else {
        resolve(this.authorization.access_token);
      }

    });
  }
}

module.exports = AccessProvider;
