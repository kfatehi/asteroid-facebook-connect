var getIdentity = function (accessToken) {
  try {
    return Meteor.http.get("https://graph.facebook.com/v2.2/me", {
      params: {access_token: accessToken}}).data;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Facebook. " + err.message),
                   {response: err.response});
  }
};

var getProfilePicture = function (accessToken) {
  try {
    return Meteor.http.get("https://graph.facebook.com/v2.0/me/picture/?redirect=false", {
      params: {access_token: accessToken}}).data.data.url;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Facebook. " + err.message),
                   {response: err.response});
  }
};

var getProfileFields = function() {
  return [
    "name",
    "location",
    "email",
    "first_name",
    "last_name",
    "locale",
    "age_range"
  ]
}

Meteor.methods({
  'Asteroid.loginWithFacebook': function(data) {
    if (data.status !== "connected") {
      throw Meteor.Error(500, "Unable to login or register with facebook", "Facebook status is not connected");
    }

    var loginRequest = data.authResponse;

    var identity = getIdentity(loginRequest.accessToken);
    var profilePicture = getProfilePicture(loginRequest.accessToken);

    var serviceData = {
        accessToken: loginRequest.accessToken,
        expiresAt: (+new Date) + (1000 * loginRequest.expiresIn)
    };

    var whitelisted = ['id', 'email', 'name', 'first_name',
        'last_name', 'link', 'username', 'gender', 'locale', 'age_range'];

    var fields = _.pick(identity, whitelisted);
    _.extend(serviceData, fields);

    var options = {profile: {}};
    var profileFields = _.pick(identity, getProfileFields());
    _.extend(options.profile, profileFields);

    options.profile.avatar = profilePicture;

    var ref = null;

    try {
      // https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_server.js#L1129
      ref = Accounts.updateOrCreateUserFromExternalService("facebook", serviceData, options);
    } catch (e) {
      if (e.reason === "Email already exists.") {
        // this user already signed up a local account, lets merge the facebook service and finish logging in
        // this email address might already exist, in which case our Accounts.updateOrCreateUserFromExternalService will fail
        // so we have to handle this case manually and try our best to merge identities.
        var existingUser = Meteor.users.findOne({ 'emails.address': identity.email });
        if ( existingUser ) {
          if ( identity.verified ) {
            Meteor.users.update({ _id: existingUser._id }, { $set: { 'services.facebook': serviceData }});
            ref = { userId: existingUser._id };
            console.log('Merged facebook identity with existing local user '+existingUser._id);
          } else {
            throw Meteor.Error(403, "Refusing to merge unverified facebook identity with existing user")
          }
        }
      } else {
        throw Meteor.Error(e.error, e.reason);
      }
    }

    //creating the token and adding to the user
    var stampedToken = Accounts._generateStampedLoginToken();
    //hashing is something added with Meteor 0.7.x, 
    //you don't need to do hashing in previous versions
    var hashStampedToken = Accounts._hashStampedToken(stampedToken);

    Meteor.users.update(ref.userId, {
      $push: {'services.resume.loginTokens': hashStampedToken}
    });

    //sending token along with the userId
    return {
      id: ref.userId,
      token: stampedToken.token
    }
  }
});
