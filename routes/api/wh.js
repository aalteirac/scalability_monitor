
const WH = require('../../models/warehouse.js');


module.exports = {
  getWHMeta: (req, res, next) => {
    WH.meta(req.query.wh_name, (err, data) => {
      if (err) {
        next(err);
      } else {
        res.send(data)
      }
    });
  },
  whCommand: (req, res, next) => {
    WH.whCommand(req.query.wh_name,req.query.command, (err, data) => {
      if (err) {
        next(err);
      } else {
        res.send(data)
      }
    });
  }
}
