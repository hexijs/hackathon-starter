module.exports = function(server, opts) {
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: false,
    },
    handler: function(req, res) {
      res.render('home', {
        title: 'Home',
      });
    },
  });
};

module.exports.attributes = {
  name: 'web/home',
};
