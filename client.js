/* This is the loginWithFacebook implementation override. Load this after asteroid.
 * The use of this method remains exactly the same as the docs on the asteroid readme show.
 * The loginWithFacebook optionally takes an array of permissions.
 * Requrements:
 * asteroid
 *    https://github.com/mondora/asteroid
 * com.phonegap.plugins.facebookconnect
 *    https://github.com/Wizcorp/phonegap-facebook-plugin
 *    http://plugins.cordova.io/#/package/com.phonegap.plugins.facebookconnect
 * Ensure that you've installed the meteor package so that the Asteroid.loginWithFacebook call is answered
 */
Asteroid.prototype.loginWithFacebook = function(permissions) {
  var self = this;
  var deferred = Q.defer();
  var done = function(err, res) {
    if (err) {
      delete self.userId;
      delete self.loggedIn;
      Asteroid.utils.multiStorage.del(self._host + "__" + self._instanceId + "__login_token__");
      deferred.reject(err);
      self._emit("loginError", err);
    } else {
      self.userId = res.id;
      self.loggedIn = true;
      Asteroid.utils.multiStorage.set(self._host + "__" + self._instanceId + "__login_token__", res.token);
      self._emit("login", res.id);
      deferred.resolve(res.id);
    }
  }
  facebookConnectPlugin.login(permissions || [ "public_profile", "email" ], function(data) {
    self.call('Asteroid.loginWithFacebook', data).result.then(function(res) {
      done(null, res);
    }, function(err) {
      done(new Error(error.reason))
    });
  }, function(err) {
    done(new Error(err.errorMessage));
  });
  return deferred.promise;
}
