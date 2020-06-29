const bcrypt = require('bcryptjs');

function requireAuth(req, res, next) {
  const authValue = req.get('Authorization') || '';
  if (!authValue.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic auth' });
  }
  const token = authValue.split(' ')[1];
  const [tokenUserName, tokenPassword] = Buffer.from(token, 'base64')
    .toString()
    .split(':');
  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.app
    .get('db')('thingful_users')
    .select('*')
    .where({ user_name: tokenUserName })
    .first()
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      bcrypt.compare(tokenPassword, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      });
      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = { requireAuth };
