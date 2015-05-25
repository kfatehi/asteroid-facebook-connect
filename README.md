# Overview

This package adds a meteor method `Asteroid.loginWithFacebook` that allows one-click facebook login and/or registration.

It has been designed for use with the facebook connect cordova plugin and is as such implementing support around the response given by that cordova plugin.

See `client.js` for the client-side patch necessary to use this package from asteroid.

You should load this one instead of the one prescribed by asteroid for facebook. The one asteroid docs tells you to use is not for facebook-connect (native facebook login) but for oauth (web browser popup), which is not desired in mobile apps.

# Installation

## For Meteor

`meteor add keyvan:asteroid-facebook-connect`

## For Clients

`bower install --save asteroid-facebook-connect`

Add `<script src="bower_components/asteroid-facebook-connect/client.js"></script>` after asteroid scripts.

# Usage

From your code, using your `asteroid` instance, simply call `asteroid.loginWithFacebook()` which is a promise.

Asteroid will emit login / logout events  as normal. Users will be created or updated in your database. Everything works as it should.

If there are any issues, please feel free to fork & PR.
